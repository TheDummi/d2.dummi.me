/** @format */

import NextAuth, { type AuthOptions } from 'next-auth';
import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers/oauth';
import bungieFetch from '../../../../../public/functions/bungieFetch';
import { signOut } from 'next-auth/react';

/**
 * Typed custom Bungie provider
 */
function BungieProvider<P extends Record<string, string> = never>(options: OAuthUserConfig<P>): OAuthConfig<P> {
	return {
		id: 'bungie',
		name: 'Bungie',
		type: 'oauth',

		authorization: {
			url: 'https://www.bungie.net/en/OAuth/Authorize',
			params: { response_type: 'code', scope: undefined },
		},

		token: 'https://www.bungie.net/platform/app/oauth/token/',

		// Bungie doesn't give useful profile info here,
		// but NextAuth requires the field to exist.
		userinfo: {
			async request({ tokens, provider }) {
				return await fetch('https://www.bungie.net/platform/User/GetMembershipsForCurrentUser', {
					headers: {
						...(provider.httpOptions?.headers as Record<string, string>),
						authorization: `Bearer ${tokens.access_token}`,
					},
				}).then(async (response) => await response.json());
			},
		},

		clientId: options.clientId,
		clientSecret: options.clientSecret,
		// @ts-expect-error - add type safe later

		async profile(_profile: Record<string, string>, tokens: Record<string, string>) {
			return {
				id: tokens.membership_id,
				bungieMembershipId: tokens.membership_id,
				accessToken: tokens.access_token,
			};
		},
	};
}

export const authOptions: AuthOptions = {
	providers: [
		BungieProvider({
			clientId: process.env.BUNGIE_ID!,
			clientSecret: process.env.BUNGIE_SECRET!,
		}),
	],

	callbacks: {
		async jwt({ token, account }) {
			if (account) {
				token.accessToken = account.access_token;
				token.refreshToken = account.refresh_token;
				token.valid = account.expires_at! * 1000 > Date.now();
				token.membershipId = account.membership_id;
			}

			if (!token.valid) {
				const response = await fetch('https://www.bungie.net/platform/app/oauth/token/', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: new URLSearchParams({
						refresh_token: token.refreshToken! as string,
						grant_type: 'refresh_token',
						client_id: process.env.BUNGIE_ID!,
						client_secret: process.env.BUNGIE_SECRET!,
					}),
				});

				if (!response.ok) return token;

				const account = await response.json();

				token.accessToken = account.access_token;
				token.refreshToken = account.refresh_token;
				token.valid = account.expirationDate > Date.now();
				token.membershipId = account.membership_id;
			}

			return token;
		},

		// @ts-expect-error - add type safe later
		async session({ session, token }: { session: Record<string, string>; token: Record<string, string> }) {
			const memberships = await bungieFetch('/User/GetMembershipsForCurrentUser', token.accessToken);
			const user = await bungieFetch(
				`/Destiny2/${memberships?.destinyMemberships?.find((m: any) => m.membershipId === memberships?.primaryMembershipId)?.membershipType}/Profile/${
					memberships?.primaryMembershipId
				}?components=100,102,103,200,201,203,204,205,900,1000`,
				token.accessToken
			);
			const friends = await bungieFetch('/Social/Friends/', token.accessToken);
			const manifest = await bungieFetch('/Destiny2/Manifest/', token.accessToken);
			const character =
				user?.characters?.data &&
				Object.entries(user?.characters?.data)
					.sort(([, a]: any, [, b]: any) => new Date(b.dateLastPlayed).getTime() - new Date(a.dateLastPlayed).getTime())
					.map(([id, data]: any) => ({ characterId: id, ...data }))[0];

			session.memberships = memberships;
			session.friends = friends?.friends;
			session.membershipType = memberships?.destinyMemberships?.find((m: any) => m.membershipId === memberships?.primaryMembershipId)?.membershipType;
			session.membershipId = token.membershipId;
			session.manifest = manifest;
			session.accessToken = token.accessToken;
			session.user = memberships?.bungieNetUser;
			session.character = character;
			session = { ...session, ...user };

			if (!session.user) return null;

			return session;
		},
	},
};

export const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

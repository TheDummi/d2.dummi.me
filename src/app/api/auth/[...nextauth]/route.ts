/** @format */

import NextAuth, { type AuthOptions } from 'next-auth';
import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers/oauth';
import bungieFetch from '../../../../../public/functions/bungieFetch';

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
				token.membershipId = account.membership_id;
			}
			return token;
		},

		// @ts-expect-error - add type safe later
		async session({ session, token }: { session: Record<string, string>; token: Record<string, string> }) {
			const memberships = await bungieFetch('/User/GetMembershipsForCurrentUser', token.accessToken);
			const user = await bungieFetch(
				`/Destiny2/${memberships.destinyMemberships?.find((m: any) => m.membershipId === memberships.primaryMembershipId)?.membershipType}/Profile/${
					memberships.primaryMembershipId
				}?components=100,900,1000`,
				token.accessToken
			);
			const friends = await bungieFetch('/Social/Friends/', token.accessToken);
			const manifest = await bungieFetch('/Destiny2/Manifest/', token.accessToken);

			session.memberships = memberships;
			session.friends = friends.friends;
			session.membershipType = memberships.destinyMemberships?.find((m: any) => m.membershipId === memberships.primaryMembershipId)?.membershipType;
			session.membershipId = token.membershipId;
			session.manifest = manifest;
			session.accessToken = token.accessToken;
			session.user = memberships.bungieNetUser;
			session = { ...session, ...user };

			return session;
		},
	},
};

export const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

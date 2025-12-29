/** @format */

'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';

type FireteamMember = {
	profile: any;
	character: any;
};

type FireteamContextType = {
	fireteam: FireteamMember[];
	loading: boolean;
};

const FireteamContext = createContext<FireteamContextType | null>(null);

export function FireteamProvider({ children }: { children: React.ReactNode }) {
	const { data: session } = useSession() as unknown as Record<string, any>;
	const [fireteam, setFireteam] = useState<FireteamMember[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!session?.profileTransitoryData?.data?.partyMembers) {
			setFireteam([]);
			setLoading(false);
			return;
		}

		let cancelled = false;

		(async () => {
			setLoading(true);
			const team: FireteamMember[] = [];

			for (const member of session.profileTransitoryData.data.partyMembers) {
				// SELF
				if (member.membershipId === session.character?.membershipId) {
					team.push({
						profile: session,
						character: session.character,
					});
					continue;
				}

				let profile: any = null;

				for (let i = 1; i <= 5; i++) {
					try {
						const res = await fetch(`/api/Destiny2/${i}/Profile/${member.membershipId}/100,200,205,900`).then((r) => r.json());

						if (res?.characters?.data) {
							profile = res;
							break;
						}
					} catch {
						/* Bungie roulette */
					}
				}

				if (!profile?.characters?.data) continue;

				const character = Object.entries(profile.characters.data)
					.sort(([, a]: any, [, b]: any) => new Date(b.dateLastPlayed).getTime() - new Date(a.dateLastPlayed).getTime())
					.map(([id, data]: any) => ({ characterId: id, ...data }))[0];

				if (!character) continue;

				team.push({ profile, character });
			}

			if (!cancelled) {
				setFireteam(team);
				setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [session]);

	return <FireteamContext.Provider value={{ fireteam, loading }}>{children}</FireteamContext.Provider>;
}

export function useFireteam() {
	const ctx = useContext(FireteamContext);
	if (!ctx) {
		throw new Error('useFireteam must be used inside FireteamProvider');
	}
	return ctx;
}

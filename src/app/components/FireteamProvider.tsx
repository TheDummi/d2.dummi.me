/** @format */

'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

import { useSession } from 'next-auth/react';

type FireteamMember = {
	profile: any;
	character: any;
};

type FireteamContextType = {
	fireteam: FireteamMember[];
	loading: boolean; // only true when no cache yet
	refreshing: boolean; // background update
};

const FireteamContext = createContext<FireteamContextType | null>(null);

export function FireteamProvider({ children }: { children: React.ReactNode }) {
	const { data: session } = useSession() as any;

	const [fireteam, setFireteam] = useState<FireteamMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const hasCache = useRef(false);
	useEffect(() => {
		if (!session) return;

		setInterval(() => setRefreshing(true), 90000);

		let cancelled = false;

		const run = async () => {
			// 🔑 Only show loading if we have no cache yet
			if (!hasCache.current) {
				setLoading(true);
			} else {
				setRefreshing(true);
			}

			const team: FireteamMember[] = [];

			// No fireteam → solo
			if (!session.profileTransitoryData?.data?.partyMembers) {
				team.push({
					profile: session,
					character: session.character,
				});
			} else {
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
							const res = await fetch(`/api/Destiny2/${i}/Profile/${member.membershipId}/100,200,205,900`).then((r) => (r.ok ? r.json() : null));

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
			}

			if (!cancelled && team.length) {
				setFireteam(team);
				hasCache.current = true;
			}

			if (!cancelled) {
				setLoading(false);
				setRefreshing(false);
			}
		};

		run();

		return () => {
			cancelled = true;
		};
	}, [session]);

	return <FireteamContext.Provider value={{ fireteam, loading, refreshing }}>{children}</FireteamContext.Provider>;
}

export function useFireteam() {
	const ctx = useContext(FireteamContext);
	if (!ctx) {
		throw new Error('useFireteam must be used inside FireteamProvider');
	}
	return ctx;
}

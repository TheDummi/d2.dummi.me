/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useCharacter } from '@/app/components/CharacterProvider';
import { useFireteam } from '@/app/components/FireteamProvider';

type FriendCharacterMap = Record<string, any>;

export default function Header() {
	const { data: session } = useSession() as unknown as Record<string, any>;
	const { activeCharacterId, setActiveCharacterId } = useCharacter();
	const { fireteam, loading: fireteamLoading, refreshing } = useFireteam();

	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [offlineOpen, setOfflineOpen] = useState(false);

	const [emblem, setEmblem] = useState('');
	const [icon, setIcon] = useState('');

	const [onlineFriends, setOnlineFriends] = useState<any[]>([]);
	const [offlineFriends, setOfflineFriends] = useState<any[]>([]);
	const [friendCharacters, setFriendCharacters] = useState<FriendCharacterMap>({});

	const [activity, setActivity] = useState<any>(null);
	const [refreshVisual, setRefreshVisual] = useState<'idle' | 'spin'>('idle');
	const [refreshCycle, setRefreshCycle] = useState(0);
	const [lastRefreshAt, setLastRefreshAt] = useState<number>(Date.now());
	const [now, setNow] = useState(Date.now());

	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const REFRESH_INTERVAL = 90_000;

	const secondsUntilRefresh = Math.max(0, Math.ceil((lastRefreshAt + REFRESH_INTERVAL - now) / 1000));

	/* -------------------- Characters -------------------- */
	const characters = session?.characters?.data ?? {};
	const fallbackCharId = Object.keys(characters)[0];

	const selectedCharId = searchParams.get('character') || session?.character?.characterId || fallbackCharId;

	const selectedCharacter = characters[selectedCharId] || characters[session?.character?.characterId];

	useEffect(() => {
		if (refreshing) return;

		const t = setInterval(() => {
			setNow(Date.now());
		}, 1000);

		return () => clearInterval(t);
	}, [refreshing]);

	useEffect(() => {
		if (refreshing) {
			setRefreshVisual('spin');
			return;
		}

		// refresh just finished
		const t = setTimeout(() => {
			setRefreshVisual('idle');
			setLastRefreshAt(Date.now());
			setRefreshCycle((c) => c + 1);
		}, 300);

		return () => clearTimeout(t);
	}, [refreshing]);

	/* -------------------- Activity -------------------- */
	useEffect(() => {
		if (!session?.characterActivities?.data) return;

		(async () => {
			const activities = await fetch(`/api/Manifest/jsonWorldComponentContentPaths/en/DestinyActivityDefinition`).then((r) => r.json());

			const hash = session.characterActivities.data[session.character.characterId]?.currentActivityHash;

			if (hash) setActivity(activities[hash]);
		})();
	}, [session]);

	/* -------------------- Friends -------------------- */
	useEffect(() => {
		if (!session?.friends) return;

		const online = session.friends
			.filter((f: any) => f.onlineStatus !== 0)
			.sort((a: any, b: any) => a.bungieNetUser?.uniqueName.localeCompare(b.bungieNetUser?.uniqueName, undefined, { sensitivity: 'base' }));

		const offline = session.friends
			.filter((f: any) => f.onlineStatus === 0)
			.sort((a: any, b: any) => a.bungieNetUser?.uniqueName.localeCompare(b.bungieNetUser?.uniqueName, undefined, { sensitivity: 'base' }));

		setOnlineFriends(online);
		setOfflineFriends(offline);

		online.forEach((friend: any) => {
			const key = `${friend.lastSeenAsBungieMembershipType}:${friend.lastSeenAsMembershipId}`;
			if (friendCharacters[key]) return;

			(async () => {
				const profile = await fetch(`/api/Destiny2/${friend.lastSeenAsBungieMembershipType}/Profile/${friend.lastSeenAsMembershipId}/100,200`).then((r) => r.json());

				const character = Object.entries(profile?.characters?.data || {})
					.sort(([, a]: any, [, b]: any) => new Date(b.dateLastPlayed).getTime() - new Date(a.dateLastPlayed).getTime())
					.map(([id, data]: any) => ({
						characterId: id,
						...data,
					}))[0];

				setFriendCharacters((prev) => ({
					...prev,
					[key]: character,
				}));
			})();
		});
	}, [session]);

	/* -------------------- Context Sync -------------------- */
	useEffect(() => {
		if (!activeCharacterId && selectedCharId) {
			setActiveCharacterId(selectedCharId);
		}
	}, [activeCharacterId, selectedCharId, setActiveCharacterId]);

	/* -------------------- Visual Sync -------------------- */
	useEffect(() => {
		if (!selectedCharacter) return;

		setEmblem(`https://bungie.net/${selectedCharacter.emblemBackgroundPath}`);
		setIcon(`https://bungie.net/${selectedCharacter.emblemPath}`);
	}, [selectedCharacter]);

	/* -------------------- Handlers -------------------- */
	const handleCharacterSelect = (charId: string) => {
		setActiveCharacterId(charId);
		setSidebarOpen(false);

		const params = new URLSearchParams(searchParams.toString());
		params.set('character', charId);
		router.replace(`${pathname}?${params.toString()}`);
	};

	/* ================================================================= */

	return (
		<>
			<header className='sticky top-0 z-50 flex flex-col text-neutral-100 shadow-md bg-cover bg-center' style={{ backgroundImage: emblem ? `url(${emblem})` : undefined }}>
				<div className='flex items-center justify-between px-6 py-3 backdrop-blur-sm bg-neutral-900/75'>
					{session ? (
						<button onClick={() => setSidebarOpen(true)} className='flex items-center gap-3 rounded-full px-3 py-1 bg-neutral-800/60 hover:bg-neutral-700/70 transition'>
							<img src={icon || undefined} className='h-10 w-10 rounded-full border-2 border-white' />
							<span className='font-medium'>{session.user?.uniqueName}</span>
						</button>
					) : (
						<button onClick={() => signIn()} className='px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition text-sm font-medium'>
							Login
						</button>
					)}
					<div className='flex items-center gap-4'>
						<a
							href='/triumphs'
							className={
								pathname === '/triumphs'
									? 'text-sm font-medium text-white underline underline-offset-4 decoration-emerald-400'
									: 'text-sm font-medium text-neutral-300 hover:text-white hover:underline underline-offset-4 decoration-neutral-500'
							}>
							Triumphs
						</a>

						<a
							href='/vault'
							className={
								pathname === '/vault'
									? 'text-sm font-medium text-white underline underline-offset-4 decoration-emerald-400'
									: 'text-sm font-medium text-neutral-300 hover:text-white hover:underline underline-offset-4 decoration-neutral-500'
							}>
							Vault
						</a>
					</div>
				</div>
				<AnimatePresence initial={false}>
					{activity && !fireteamLoading && session?.profileTransitoryData?.data?.partyMembers && (
						<motion.div
							layout
							initial={{ opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ duration: 0.25, ease: 'easeOut' }}
							className='relative px-6 py-3 text-sm flex items-center bg-cover bg-center'
							style={{
								backgroundImage: activity.pgcrImage ? `url(https://bungie.net${activity.pgcrImage})` : undefined,
							}}>
							{/* background overlay */}
							<div className='absolute inset-0 bg-neutral-900/70 backdrop-blur-[2px]' />

							{/* activity (centered) */}
							<div className='relative z-10 flex items-center gap-2 mx-auto'>
								<img src={`https://bungie.net${activity.displayProperties.icon}`} className='h-6 w-6' />
								<span className='font-medium text-white drop-shadow'>{activity.displayProperties.name || 'Orbit'}</span>
							</div>

							{/* fireteam (right aligned) */}
							<div className='relative z-10 ml-auto flex items-center gap-3'>
								{fireteam.map((member, i) => {
									const user = member.profile?.profile?.data?.userInfo;

									const bg = member?.character?.emblemBackgroundPath ? `https://bungie.net${member.character.emblemBackgroundPath}` : undefined;

									const ico = member?.character?.emblemPath ? `https://bungie.net${member.character.emblemPath}` : undefined;

									return (
										<div key={i} className='relative rounded-full overflow-hidden'>
											{bg && <div className='absolute inset-0 bg-cover bg-center opacity-30' style={{ backgroundImage: `url(${bg})` }} />}

											<div className='relative z-10 flex items-center gap-2 px-2 py-1 bg-neutral-800/70 backdrop-blur-sm border border-white/10'>
												{ico ? <img src={ico} className='h-7 w-7 rounded-full border border-white/60' /> : <div className='h-7 w-7 rounded-full bg-neutral-700 animate-pulse' />}

												<div className='text-xs whitespace-nowrap text-white drop-shadow'>
													{user?.bungieGlobalDisplayName}
													<span className='text-neutral-300'>#{user?.bungieGlobalDisplayNameCode}</span>
												</div>
											</div>
										</div>
									);
								})}
							</div>

							<div className='relative z-10 flex items-center gap-2 pl-4' title={refreshing ? 'Updating fireteam…' : `Updating in ${secondsUntilRefresh}s`}>
								<div className='relative w-5 h-5'>
									<AnimatePresence mode='wait'>
										{refreshVisual === 'idle' ? (
											<motion.svg
												key={`idle-${refreshCycle}`}
												viewBox='0 0 36 36'
												className='absolute inset-0 text-purple-400/70'
												initial={{ opacity: 0, scale: 0.8 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0.8 }}
												style={
													{
														'--fill-duration': '60s',
													} as React.CSSProperties
												}>
												<circle cx='18' cy='18' r='16' fill='none' stroke='currentColor' strokeWidth='2' strokeDasharray='100' strokeDashoffset='100' className='animate-circle-fill' />
											</motion.svg>
										) : (
											<motion.svg
												key='spin'
												viewBox='0 0 24 24'
												className='absolute inset-0 text-purple-400 animate-spin-slow'
												fill='none'
												stroke='currentColor'
												strokeWidth='2'
												initial={{ opacity: 0, scale: 0.8 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0.8 }}>
												<path d='M21 12a9 9 0 1 1-2.64-6.36' />
												<polyline points='21 3 21 9 15 9' />
											</motion.svg>
										)}
									</AnimatePresence>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</header>

			{/* SIDEBAR */}
			<AnimatePresence>
				{sidebarOpen && (
					<>
						<motion.div className='fixed inset-0 z-40 bg-black/60' onClick={() => setSidebarOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

						<motion.aside
							className='fixed left-0 top-0 z-50 h-full w-80 bg-linear-to-b from-neutral-900 via-neutral-900 to-black shadow-2xl'
							initial={{ x: -320 }}
							animate={{ x: 0 }}
							exit={{ x: -320 }}>
							<div className='p-4 border-b border-neutral-800'>Characters</div>

							<div className='px-4 py-3 space-y-2'>
								{Object.entries(characters).map(([charId, charData]: any) => {
									const bg = charData.emblemBackgroundPath ? `https://bungie.net${charData.emblemBackgroundPath}` : undefined;

									const ico = charData.emblemPath ? `https://bungie.net${charData.emblemPath}` : undefined;

									return (
										<button key={charId} onClick={() => handleCharacterSelect(charId)} className='relative w-full rounded-xl overflow-hidden text-left'>
											{bg && (
												<div
													className='absolute inset-0 opacity-30 bg-cover bg-center'
													style={{
														backgroundImage: `url(${bg})`,
													}}
												/>
											)}

											<div className='relative z-10 flex items-center gap-3 px-3 py-2 hover:bg-neutral-800/60 transition'>
												{ico ? <img src={ico} className='h-8 w-8 rounded-full border border-white/60' /> : <div className='h-8 w-8 rounded-full bg-neutral-700 animate-pulse' />}

												<div className='text-sm font-medium'>
													{charData.light} — {charData.classType === 0 ? 'Titan' : charData.classType === 1 ? 'Hunter' : 'Warlock'}
												</div>
											</div>
										</button>
									);
								})}
							</div>

							<div className='pt-6 px-4 border-t border-neutral-800 space-y-2'>
								{onlineFriends.map((friend: any) => {
									const key = `${friend.lastSeenAsBungieMembershipType}:${friend.lastSeenAsMembershipId}`;
									const character = friendCharacters[key];

									const bg = character ? `https://bungie.net${character.emblemBackgroundPath}` : undefined;

									const ico = character ? `https://bungie.net${character.emblemPath}` : undefined;

									return (
										<div key={key} className='relative rounded-xl overflow-hidden min-h-11'>
											{bg && (
												<div
													className='absolute inset-0 opacity-30 bg-cover bg-center'
													style={{
														backgroundImage: `url(${bg})`,
													}}
												/>
											)}

											<div className='relative z-10 flex items-center gap-3 px-3 py-2'>
												{ico ? <img src={ico} className='h-8 w-8 rounded-full border border-white/60' /> : <div className='h-8 w-8 rounded-full bg-neutral-700 animate-pulse' />}

												<div className='text-sm font-medium'>{friend.bungieNetUser?.uniqueName}</div>
											</div>
										</div>
									);
								})}

								{offlineFriends.length > 0 && (
									<div className='pt-2'>
										<button
											onClick={() => setOfflineOpen((v) => !v)}
											className='w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition'>
											<span>Offline ({offlineFriends.length})</span>
											<motion.span
												animate={{
													rotate: offlineOpen ? 90 : 0,
												}}
												transition={{
													duration: 0.2,
												}}>
												▶
											</motion.span>
										</button>

										<AnimatePresence>
											{offlineOpen && (
												<motion.div
													initial={{
														height: 0,
														opacity: 0,
													}}
													animate={{
														height: 'auto',
														opacity: 1,
													}}
													exit={{
														height: 0,
														opacity: 0,
													}}
													className='overflow-hidden'>
													<div className='mt-1 space-y-1'>
														{offlineFriends.map((friend: any, i: number) => (
															<div key={i} className='px-3 py-2 rounded-lg text-sm text-neutral-500 hover:bg-neutral-800 transition'>
																{friend.bungieNetUser?.uniqueName}
															</div>
														))}
													</div>
												</motion.div>
											)}
										</AnimatePresence>
									</div>
								)}
							</div>

							<div className='p-3 border-t border-neutral-800'>
								<button onClick={() => signOut()} className='w-full text-left text-red-400'>
									Log Out
								</button>
							</div>
						</motion.aside>
					</>
				)}
			</AnimatePresence>
		</>
	);
}

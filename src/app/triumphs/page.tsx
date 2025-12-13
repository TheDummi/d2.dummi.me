/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';

import { redirect } from 'next/navigation';
import triumphFormatter from '../../../public/functions/triumphFormatter';
import { useSession } from 'next-auth/react';

export default function Home() {
	const { data: session } = useSession() as unknown as Record<string, any>;

	if (!session) redirect('/api/auth/signin');

	const [manifest, setManifest] = useState<Record<string, any> | null>(null);
	const [fireteam, setFireteam] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [hideCompleted, setHideCompleted] = useState(false);
	const [activeCollection, setActiveCollection] = useState<string>('All');

	/* ------------------------------ Manifest + Profiles ------------------------------ */
	useEffect(() => {
		if (!session) return;

		(async () => {
			setLoading(true);

			const man = await fetch(`/api/Manifest/jsonWorldComponentContentPaths/en/DestinyRecordDefinition`).then((res) => res.json());

			setManifest(triumphFormatter(man));

			const members: any[] = [];
			for (const member of session?.profileTransitoryData?.data?.partyMembers ?? [{ membershipId: session?.memberships?.primaryMembershipId }]) {
				let profile = null;
				for (let i = 1; i < 6; i++) {
					const data = await fetch(`/api/Destiny2/${i}/Profile/${member.membershipId}/100,900`)
						.then((res) => res.json())
						.catch(() => null);
					if (data) {
						profile = data;
						break;
					}
				}
				members.push({ ...member, profile });
			}
			setFireteam(members);
			setLoading(false);
		})();
	}, [session]);

	/* ------------------------------ Completion Logic ------------------------------ */
	const filteredTriumphs = useMemo(() => {
		if (!manifest) return [];

		return Object.entries(manifest)
			.map(([recordHash, record]: any) => {
				const completedCount = fireteam.filter((member) => {
					const rec = member.profile?.profileRecords?.data?.records?.[recordHash];
					return rec?.objectives?.every((o: any) => o.complete);
				}).length;
				return { recordHash, record, completedCount };
			})
			.filter(({ record }) => record.type === 'Triumph' || record.type === undefined)
			.sort((a, b) => b.completedCount - a.completedCount);
	}, [manifest, fireteam]);

	/* ------------------------------ Collection Grouping ------------------------------ */
	const triumphsByCollection = useMemo(() => {
		const groups: Record<string, typeof filteredTriumphs> = {};
		for (const triumph of filteredTriumphs) {
			const collection = triumph.record?.type === 'Triumph' ? triumph.record?.collection ?? 'Untracked' : 'Untracked';
			if (!groups[collection]) groups[collection] = [];
			groups[collection].push(triumph);
		}
		return groups;
	}, [filteredTriumphs]);

	const collections = useMemo(() => ['All', ...Object.keys(triumphsByCollection)], [triumphsByCollection]);
	const displayedTriumphs = activeCollection === 'All' ? Object.values(triumphsByCollection).flat() : triumphsByCollection[activeCollection] ?? [];

	/* ------------------------------ Fireteam Completion ------------------------------ */
	const totalTriumphs = filteredTriumphs.length;
	const totalCompleted = filteredTriumphs.filter((t) => t.completedCount === fireteam.length).length;
	const completionPercentage = totalTriumphs ? Math.round((totalCompleted / totalTriumphs) * 100) : 0;

	return (
		<div className='min-h-screen bg-neutral-950 text-neutral-100 p-6 flex gap-6'>
			<aside className='w-64 shrink-0 rounded-2xl bg-neutral-900 p-4 space-y-2'>
				<h2 className='text-sm font-semibold text-neutral-400 mb-2'>Collections</h2>
				<p className='text-sm text-neutral-400 mb-2'>{completionPercentage}% Triumphs Completed</p>
				{collections.map((collection) => {
					if (collection === 'All')
						return (
							<button
								key={collection}
								onClick={() => setActiveCollection(collection)}
								className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${activeCollection === collection ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:bg-neutral-800'}`}>
								{collection}
							</button>
						);
					const triumphs = triumphsByCollection[collection];
					const completedCount = triumphs.filter((t) => t.completedCount === fireteam.length).length;
					const collectionCompletion = triumphs.length ? Math.round((completedCount / triumphs.length) * 100) : 0;
					const isCompleted = collectionCompletion === 100;
					return (
						<button
							key={collection}
							onClick={() => setActiveCollection(collection)}
							className={`w-full flex justify-between px-3 py-2 rounded-lg text-sm transition ${
								activeCollection === collection ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:bg-neutral-800'
							} ${isCompleted ? 'bg-emerald-800 text-white' : ''}`}>
							<span>{collection}</span>
							<span>{collectionCompletion}%</span>
						</button>
					);
				})}
			</aside>

			<main className='flex-1'>
				<div className='max-w-7xl mx-auto space-y-6'>
					<header className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
						<div className='space-y-1'>
							<h1 className='text-3xl font-semibold tracking-tight'>Fireteam Triumph Progress</h1>
							<p className='text-sm text-neutral-400'>Showing {displayedTriumphs.length} triumphs</p>
						</div>

						<button onClick={() => setHideCompleted((v) => !v)} className='px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition'>
							{hideCompleted ? 'Show Completed Triumphs' : 'Hide Completed Triumphs'}
						</button>
					</header>

					<section className='flex flex-wrap justify-evenly gap-4'>
						{fireteam.map((member) => (
							<div key={member.membershipId} className='rounded-2xl bg-neutral-900 p-3 text-center shadow'>
								<div className='text-sm font-medium'>
									{member.profile?.profile?.data?.userInfo?.bungieGlobalDisplayName}
									<span className='text-neutral-400'>#{member.profile?.profile?.data?.userInfo?.bungieGlobalDisplayNameCode}</span>
									<p>
										{member.profile?.profileRecords?.data?.activeScore?.toLocaleString()} - {member.profile?.profileRecords?.data?.lifetimeScore?.toLocaleString()}
									</p>
								</div>
							</div>
						))}
					</section>

					{loading && <div className='text-neutral-400'>Loading fireteam data…</div>}

					<section className='space-y-6'>
						{displayedTriumphs.map(({ recordHash: hash, record }: any) => {
							const isCompleted = fireteam.length && fireteam.every((m) => m.profile?.profileRecords?.data?.records?.[hash]?.objectives?.every((o: any) => o.complete));
							return (
								<div key={hash} className={`rounded-2xl p-6 shadow ${isCompleted ? 'bg-emerald-800' : 'bg-neutral-900'}`}>
									<div className='flex gap-4'>
										<img
											src={`https://bungie.net${record.displayProperties.icon || '/common/destiny2_content/icons/8b17ad1776efe8d00480e7c4c03f7470.png'}`}
											alt=''
											className='w-14 h-14 rounded-lg bg-neutral-800 object-contain'
										/>
										<div className='flex-1'>
											<h2 className='text-lg font-semibold'>{record.displayProperties.name}</h2>
											<p className='text-sm text-neutral-400'>{record.displayProperties.description}</p>
											{record.title ? <p className='mt-1 text-sm italic text-amber-400'>{record.title}</p> : <p className='mt-1 text-sm italic text-neutral-500'>Does not count towards title</p>}
											{!record.collection && hash}
										</div>
									</div>

									<div className='mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
										{fireteam.map((member) => {
											const recordData = member.profile?.profileRecords?.data?.records?.[hash];
											return (
												<div key={member.membershipId} className='rounded-xl bg-neutral-800 p-3 text-sm flex items-center justify-between'>
													<span>{member.profile?.profile?.data?.userInfo?.bungieGlobalDisplayName}</span>
													<span className='flex gap-1'>
														{recordData?.objectives?.filter(Boolean)?.map((obj: any, i: number) => (
															<span key={i} className={obj.complete ? 'text-emerald-400' : 'text-neutral-500'}>
																●
															</span>
														))}
													</span>
												</div>
											);
										})}
									</div>
								</div>
							);
						})}
					</section>
				</div>
			</main>
		</div>
	);
}

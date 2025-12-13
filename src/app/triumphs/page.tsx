/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';

import { redirect } from 'next/navigation';
import triumphAssign from '../../../public/functions/triumphAssign';
import { useSession } from 'next-auth/react';

type SortOrder = 'default' | 'hash' | 'completion';

export default function Home() {
	const { data: session } = useSession() as unknown as Record<string, any>;
	if (!session) redirect('/api/auth/signin');

	const [manifest, setManifest] = useState<Record<string, any> | null>(null);
	const [fireteam, setFireteam] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const [activeTitle, setActiveTitle] = useState<string>('All');
	const [searchTerm, setSearchTerm] = useState('');
	const [sortOrder, setSortOrder] = useState<SortOrder>('default');
	const [hideCompleted, setHideCompleted] = useState(false);

	/* ------------------------------ Fetch Manifest + Profiles ------------------------------ */
	useEffect(() => {
		if (!session) return;

		(async () => {
			setLoading(true);

			const raw = await fetch(`/api/Manifest/jsonWorldComponentContentPaths/en/DestinyRecordDefinition`).then((r) => r.json());

			const triumphs: Record<string, any> = {};

			for (const [hash, record] of Object.entries(raw) as any) {
				if (record.loreHash) continue;
				if (record.recordTypeName !== 'Triumphs') continue;

				triumphs[hash] = record;
			}

			setManifest(triumphAssign(triumphs));

			const members: any[] = [];
			for (const member of session?.profileTransitoryData?.data?.partyMembers ?? [{ membershipId: session?.memberships?.primaryMembershipId }]) {
				let profile = null;
				for (let i = 1; i <= 5; i++) {
					const res = await fetch(`/api/Destiny2/${i}/Profile/${member.membershipId}/100,900`)
						.then((r) => r.json())
						.catch(() => null);
					if (res) {
						profile = res;
						break;
					}
				}
				members.push({ ...member, profile });
			}

			setFireteam(members);
			setLoading(false);
		})();
	}, [session]);

	/* ------------------------------ Normalize Triumphs ------------------------------ */
	const allTriumphs = useMemo(() => {
		if (!manifest) return [];

		return Object.entries(manifest)
			.map(([recordHash, record]: any) => {
				const completedCount = fireteam.filter((member) => {
					const rec = member.profile?.profileRecords?.data?.records?.[recordHash];
					return rec?.objectives?.every((o: any) => o.complete);
				}).length;

				return {
					recordHash,
					record,
					title: record.titleInfo?.titlesByGender?.Male ?? 'Untracked',
					completedCount,
				};
			})
			.filter((t) => t.record?.displayProperties?.name && (t.record.type === 'Triumph' || t.record.type === undefined));
	}, [manifest, fireteam]);

	/* ------------------------------ Group by Title (Sidebar) ------------------------------ */
	const triumphsByTitle = useMemo(() => {
		const groups: Record<string, typeof allTriumphs> = {};
		for (const t of allTriumphs) {
			if (!groups[t.title]) groups[t.title] = [];
			groups[t.title].push(t);
		}
		return groups;
	}, [allTriumphs]);

	const titles = useMemo(() => ['All', ...Object.keys(triumphsByTitle)], [triumphsByTitle]);

	/* ------------------------------ Sidebar Stats ------------------------------ */
	const sidebarStats = useMemo(() => {
		return titles.map((title) => {
			if (title === 'All') return { title, percent: null };

			const list = triumphsByTitle[title] ?? [];
			const completed = list.filter((t) => t.completedCount === fireteam.length).length;

			const percent = list.length ? Math.round((completed / list.length) * 100) : 0;

			return { title, percent };
		});
	}, [titles, triumphsByTitle, fireteam.length]);

	/* ------------------------------ Apply Filters / Search / Sort ------------------------------ */
	const displayedTriumphs = useMemo(() => {
		let list = activeTitle === 'All' ? allTriumphs : triumphsByTitle[activeTitle] ?? [];

		if (hideCompleted) {
			list = list.filter((t) => t.completedCount !== fireteam.length);
		}

		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			list = list.filter((t) => t.record.displayProperties.name.toLowerCase().includes(term) || t.recordHash.toLowerCase().includes(term) || t.title.toLowerCase().includes(term));
		}

		if (sortOrder === 'completion') {
			list = [...list].sort((a, b) => b.completedCount - a.completedCount);
		}

		if (sortOrder === 'hash') {
			list = [...list].sort((a, b) => a.recordHash.localeCompare(b.recordHash));
		}

		return list;
	}, [allTriumphs, triumphsByTitle, activeTitle, searchTerm, sortOrder, hideCompleted, fireteam.length]);

	/* ------------------------------ Render ------------------------------ */
	return (
		<div className='min-h-screen bg-neutral-950 text-neutral-100 flex'>
			{/* Sidebar */}
			<aside className='w-72 shrink-0 bg-neutral-900 p-4 space-y-2 overflow-hidden'>
				<div className='space-y-1'>
					{sidebarStats.map(({ title, percent }) => (
						<button
							key={title}
							onClick={() => {
								setActiveTitle(title);
								setSearchTerm('');
							}}
							className={`w-full flex justify-between px-3 py-2 rounded-lg text-sm transition ${activeTitle === title ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:bg-neutral-800'} ${
								percent === 100 ? 'bg-emerald-800 text-white' : ''
							}`}>
							<span className='truncate'>{title}</span>
							{percent !== null && <span>{percent}%</span>}
						</button>
					))}
				</div>
			</aside>

			{/* Main (Scrollable) */}
			<main className='flex-1 overflow-y-auto p-6'>
				<div className='max-w-7xl mx-auto space-y-6'>
					<header className='flex flex-wrap gap-3 justify-between items-center'>
						<div>
							<h1 className='text-3xl font-semibold'>Fireteam Triumph Progress</h1>
							<p className='text-sm text-neutral-400'>Showing {displayedTriumphs.length} triumphs</p>
						</div>

						<div className='flex gap-2 flex-wrap'>
							<input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder='Search name, title, hash…' className='px-3 py-1 rounded-lg bg-neutral-800 text-sm' />

							<button onClick={() => setSortOrder('default')} className='px-3 py-1 rounded-lg bg-neutral-800 text-sm'>
								Default
							</button>
							<button onClick={() => setSortOrder('completion')} className='px-3 py-1 rounded-lg bg-neutral-800 text-sm'>
								Completion
							</button>
							<button onClick={() => setSortOrder('hash')} className='px-3 py-1 rounded-lg bg-neutral-800 text-sm'>
								Hash
							</button>

							<button onClick={() => setHideCompleted((v) => !v)} className='px-3 py-1 rounded-lg bg-neutral-800 text-sm'>
								{hideCompleted ? 'Show Completed' : 'Hide Completed'}
							</button>
						</div>
					</header>

					{loading && <p className='text-neutral-400'>Loading fireteam…</p>}

					<section className='space-y-6'>
						{displayedTriumphs.map(({ recordHash, record, title, completedCount }) => (
							<div key={recordHash} className={`rounded-2xl p-6 shadow ${completedCount === fireteam.length ? 'bg-emerald-800' : 'bg-neutral-900'}`}>
								<div className='flex gap-4'>
									<img
										src={`https://bungie.net${record.displayProperties.icon || '/common/destiny2_content/icons/8b17ad1776efe8d00480e7c4c03f7470.png'}`}
										className='w-14 h-14 rounded-lg bg-neutral-800 object-contain'
									/>

									<div className='flex-1'>
										<h2 className='text-lg font-semibold'>{record.displayProperties.name}</h2>
										<p className='text-sm text-neutral-400'>{record.displayProperties.description}</p>
										{record.titleInfo.hasTitle && record.titleInfo.required && <p className='mt-1 text-xs italic text-amber-400'>{title}</p>}
										{record.titleInfo.hasTitle && !record.titleInfo.required && <p className='mt-1 text-xs italic text-cyan-400'>Not required for title</p>}
										<p className='text-xs text-neutral-500'>Hash: {recordHash}</p>
									</div>
								</div>

								{/* Fireteam */}
								<div className='mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
									{fireteam.map((member) => {
										const rec = member.profile?.profileRecords?.data?.records?.[recordHash];

										return (
											<div key={member.membershipId} className='flex justify-between items-center rounded-xl bg-neutral-800 px-3 py-2 text-sm'>
												<span className='truncate'>{member.profile?.profile?.data?.userInfo?.bungieGlobalDisplayName}</span>
												<span className='flex gap-1'>
													{rec?.objectives?.map((o: any, i: number) => (
														<span key={i} className={o.complete ? 'text-emerald-400' : 'text-neutral-500'}>
															●
														</span>
													))}
												</span>
											</div>
										);
									})}
								</div>
							</div>
						))}
					</section>
				</div>
			</main>
		</div>
	);
}

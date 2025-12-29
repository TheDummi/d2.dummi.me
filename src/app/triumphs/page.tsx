/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { signIn, useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';

import { useFireteam } from '@/app/components/FireteamProvider';

type Collection = {
	hash: string;
	name: string;
	records: any[];
};

const PAGE_SIZE = 100;

export default function Page() {
	const { data: session } = useSession() as any;
	if (!session) return signIn();

	const { fireteam, loading: fireteamLoading } = useFireteam();

	const [collections, setCollections] = useState<Collection[]>([]);
	const [objectiveDefs, setObjectiveDefs] = useState<Record<string, any>>({});
	const [activeCollection, setActiveCollection] = useState<string>('ALL');
	const [highlightRecord, setHighlightRecord] = useState<string | null>(null);

	const [search, setSearch] = useState('');
	const [hideCompleted, setHideCompleted] = useState(false);
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
	const [loading, setLoading] = useState(true);

	/* -------------------- Load Manifest -------------------- */
	useEffect(() => {
		(async () => {
			setLoading(true);

			const [recordDefs, nodeDefs, objectiveDefs] = await Promise.all([
				fetch('/api/Manifest/jsonWorldComponentContentPaths/en/DestinyRecordDefinition').then((r) => r.json()),
				fetch('/api/Manifest/jsonWorldComponentContentPaths/en/DestinyPresentationNodeDefinition').then((r) => r.json()),
				fetch('/api/Manifest/jsonWorldComponentContentPaths/en/DestinyObjectiveDefinition').then((r) => r.json()),
			]);

			setObjectiveDefs(objectiveDefs);

			const result: Collection[] = [];

			for (const [hash, node] of Object.entries(nodeDefs) as any) {
				if (!node.displayProperties?.name) continue;
				if (!node.children?.records?.length) continue;

				const records = node.children.records.map((c: any) => recordDefs[c.recordHash]).filter(Boolean);

				if (records.length) {
					result.push({ hash, name: node.displayProperties.name, records });
				}
			}

			setCollections(result);
			setLoading(false);
		})();
	}, []);

	/* -------------------- Helpers -------------------- */
	const hasVisibleRecord = (member: any, recordHash: string) => {
		const rec = member.profile?.profileRecords?.data?.records?.[recordHash];
		return Array.isArray(rec?.objectives) && rec.objectives.length > 0;
	};

	/* -------------------- Derived -------------------- */
	const allRecords = useMemo(() => Array.from(new Set(collections.flatMap((c) => c.records))), [collections]);

	const current = useMemo(() => {
		if (activeCollection === 'ALL') {
			return { hash: 'ALL', name: 'All Triumphs', records: allRecords };
		}
		return collections.find((c) => c.hash === activeCollection) ?? null;
	}, [activeCollection, collections, allRecords]);

	const findCollectionForRecord = (recordHash: string) => {
		return collections.find((c) => c.records.some((r) => r.hash === recordHash))?.hash;
	};

	/* -------------------- Completion Logic -------------------- */
	const completionScore = (record: any) => {
		const visibleMembers = fireteam.filter((m) => hasVisibleRecord(m, record.hash));
		if (!visibleMembers.length) return 0;

		return (
			visibleMembers.reduce((sum, m) => {
				const rec = m.profile.profileRecords.data.records[record.hash];
				const done = rec.objectives.filter((o: any) => o.complete).length;
				return sum + done / rec.objectives.length;
			}, 0) / visibleMembers.length
		);
	};

	const collectionPercent = (records: any[]) => {
		if (!records.length) return 0;
		const total = records.reduce((sum, r) => sum + completionScore(r), 0);
		return Math.round((total / records.length) * 100);
	};

	/* -------------------- Filter + Sort -------------------- */
	const displayedRecords = useMemo(() => {
		if (!current) return [];

		let list = current.records;

		if (search) {
			const s = search.toLowerCase();
			list = list.filter((r) => r.displayProperties.name.toLowerCase().includes(s));
		}

		if (hideCompleted) {
			list = list.filter((r) => completionScore(r) < 1);
		}

		list = [...list].sort((a, b) => {
			const diff = completionScore(b) - completionScore(a);
			return sortOrder === 'desc' ? diff : -diff;
		});

		return list;
	}, [current, search, hideCompleted, sortOrder, fireteam]);

	/* -------------------- Pagination reset -------------------- */
	useEffect(() => {
		setVisibleCount(PAGE_SIZE);
	}, [activeCollection, search, hideCompleted, sortOrder]);

	/* -------------------- Highlight reset -------------------- */
	useEffect(() => {
		if (!highlightRecord) return;
		const t = setTimeout(() => setHighlightRecord(null), 900);
		return () => clearTimeout(t);
	}, [highlightRecord]);

	if (loading || fireteamLoading) {
		return <div className='p-6 text-neutral-400'>Loading triumphs…</div>;
	}

	return (
		<div className='min-h-screen flex bg-neutral-950 text-neutral-100'>
			{/* SIDEBAR */}
			<aside className='w-72 sticky top-0 h-screen overflow-y-auto bg-neutral-900 border-r border-neutral-800 p-2 pr-1 space-y-1'>
				{[{ hash: 'ALL', name: 'All', records: allRecords }, ...collections].map((c, i) => {
					const percent = collectionPercent(c.records);

					return (
						<button
							key={i}
							onClick={() => setActiveCollection(c.hash)}
							className={`w-full px-3 py-2 rounded text-left space-y-1 ${activeCollection === c.hash ? 'bg-neutral-800' : 'hover:bg-neutral-800'}`}>
							<div className='flex justify-between text-sm'>
								<span className='truncate'>{c.name}</span>
								<span className='text-neutral-400'>{percent}%</span>
							</div>
							<div className='h-1 bg-neutral-800 rounded overflow-hidden'>
								<div className='h-full bg-emerald-400' style={{ width: `${percent}%` }} />
							</div>
						</button>
					);
				})}
			</aside>

			{/* MAIN */}
			<main className='flex-1 p-6'>
				<div className='max-w-6xl mx-auto space-y-6'>
					{/* Header */}
					<div className='flex justify-between items-center'>
						<h1 className='text-2xl font-semibold'>{current?.name}</h1>

						<div className='flex gap-2'>
							<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search triumphs…' className='bg-neutral-800 px-3 py-1 rounded text-sm' />
							<button onClick={() => setHideCompleted((v) => !v)} className='bg-neutral-800 px-3 py-1 rounded text-sm'>
								{hideCompleted ? 'Show Completed' : 'Hide Completed'}
							</button>
							<button onClick={() => setSortOrder((v) => (v === 'desc' ? 'asc' : 'desc'))} className='bg-neutral-800 px-3 py-1 rounded text-sm'>
								Sort
							</button>
						</div>
					</div>

					{/* Triumphs */}
					<div className='space-y-4'>
						<AnimatePresence>
							{displayedRecords.slice(0, visibleCount).map((record, i) => {
								const percent = Math.round(completionScore(record) * 100);

								return (
									<motion.div key={i} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className='bg-neutral-900 rounded-xl overflow-hidden'>
										<div className='p-4 flex gap-4'>
											<img src={`https://bungie.net${record.displayProperties.icon}`} className='w-12 h-12 rounded bg-neutral-800' alt='' />
											<div className='flex-1'>
												<h2 className='font-medium'>{record.displayProperties.name}</h2>
												<p className='text-sm text-neutral-400'>{record.displayProperties.description}</p>
											</div>
											<div className='text-sm'>{percent}%</div>
										</div>

										{/* Fireteam */}
										<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 px-4 pb-4'>
											{fireteam.map((m: any, i) => {
												const rec = m.profile?.profileRecords?.data?.records?.[record.hash];
												const objectives = rec?.objectives ?? [];
												const bg = m.character?.emblemBackgroundPath ? `https://bungie.net${m.character.emblemBackgroundPath}` : undefined;

												return (
													<div key={i} className='relative rounded-lg overflow-hidden'>
														{bg && <div className='absolute inset-0 bg-cover bg-center opacity-30' style={{ backgroundImage: `url(${bg})` }} />}

														<div className='relative z-10 bg-neutral-900/80 px-3 py-2 flex items-center gap-3'>
															<span className='flex-1 truncate text-sm'>{m.profile?.profile?.data?.userInfo?.bungieGlobalDisplayName}</span>

															<div className='flex gap-1'>
																{objectives.map((o: any, i: number) => (
																	<span key={i} className={`text-xs ${o.complete ? 'text-emerald-400' : 'text-neutral-500'}`}>
																		●
																	</span>
																))}
															</div>
														</div>
													</div>
												);
											})}
										</div>

										<div className='h-1 bg-neutral-800'>
											<div className='h-full bg-emerald-400' style={{ width: `${percent}%` }} />
										</div>
									</motion.div>
								);
							})}
						</AnimatePresence>

						{visibleCount < displayedRecords.length && (
							<div className='flex justify-center pt-6'>
								<button onClick={() => setVisibleCount((v) => v + PAGE_SIZE)} className='px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700'>
									Load more ({Math.min(PAGE_SIZE, displayedRecords.length - visibleCount)})
								</button>
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}

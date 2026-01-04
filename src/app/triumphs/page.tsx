/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { signIn, useSession } from 'next-auth/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import Loader from '../components/Loader';
import { useFireteam } from '@/app/components/FireteamProvider';

type Collection = {
	hash: string;
	name: string;
	records: any[];
};

type CompletionMode = 'avg' | 'worst' | 'best';
type SortMode = 'completion' | 'time';

const PAGE_SIZE = 100;

export default function Page() {
	const { data: session } = useSession() as any;
	if (!session) return signIn();

	const { fireteam, loading: fireteamLoading } = useFireteam();

	const [collections, setCollections] = useState<Collection[]>([]);
	const [objectiveDefs, setObjectiveDefs] = useState<Record<string, any>>({});

	const [activeCollection, setActiveCollection] = useState<string>('ALL');
	const [search, setSearch] = useState('');
	const [hideCompleted, setHideCompleted] = useState(false);
	const [completionMode, setCompletionMode] = useState<CompletionMode>('avg');
	const [sortMode, setSortMode] = useState<SortMode>('completion');
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
	const [targeted, setTargeted] = useState<string | null>(null);
	const [highlightRecord, setHighlightRecord] = useState<string | null>(null);
	const [highlightCollection, setHighlightCollection] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const previousScores = useRef<Record<string, number>>({});
	const lastUpdated = useRef<Record<string, number>>({});

	const recordRefs = useRef<Record<string, HTMLDivElement | null>>({});

	/* -------------------- Auto-scroll to targeted triumph -------------------- */
	useEffect(() => {
		if (!targeted) return;

		const el = recordRefs.current[targeted];
		if (!el) return;

		// Let Framer Motion + layout finish first
		const raf1 = requestAnimationFrame(() => {
			const raf2 = requestAnimationFrame(() => {
				el.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
				});
			});
			return () => cancelAnimationFrame(raf2);
		});

		return () => cancelAnimationFrame(raf1);
	}, [targeted]);

	/* -------------------- Manifest -------------------- */
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

				const records = node.children.records.map((c: any) => recordDefs[c.recordHash]).filter((r: any) => !r.loreHash && r.recordTypeName == 'Triumphs');

				if (records.length) result.push({ hash, name: node.displayProperties.name, records });
			}

			setCollections(result);
			setLoading(false);
		})();
	}, []);

	/* -------------------- Helpers -------------------- */
	const hasVisibleRecord = (m: any, h: string) => {
		const r = m.profile?.profileRecords?.data?.records?.[h];
		return Array.isArray(r?.objectives);
	};

	const completionValues = (record: any) =>
		fireteam
			.map((m) => {
				const rec = m.profile?.profileRecords?.data?.records?.[record.hash];
				const objectives = rec?.objectives;

				if (!Array.isArray(objectives) || objectives.length === 0) return null;

				const done = objectives.filter((o: any) => o.complete).length;
				return done / objectives.length;
			})
			.filter((v): v is number => typeof v === 'number');

	const completionScore = (record: any) => {
		const v = completionValues(record);
		if (!v.length) return 0;
		if (completionMode === 'worst') return Math.min(...v);
		if (completionMode === 'best') return Math.max(...v);
		return v.reduce((a, b) => a + b, 0) / v.length;
	};

	const timeToFinish = (record: any) => {
		let remaining = 0;
		let members = 0;

		for (const m of fireteam ?? []) {
			if (!m?.profile?.profileRecords?.data?.records) continue;

			const rec = m.profile.profileRecords.data.records[record.hash];
			if (!rec) continue;

			const objectives = rec.objectives;
			if (!Array.isArray(objectives) || objectives.length === 0) continue;

			const left = objectives.filter((o: any) => !o.complete).length;
			if (left > 0) {
				remaining += left;
				members++;
			}
		}

		return members ? remaining / members : Infinity;
	};

	const closestBlocker = (record: any) => {
		const all = fireteam.flatMap((m) => m.profile?.profileRecords?.data?.records?.[record.hash]?.objectives ?? []);
		const inc = all.filter((o: any) => !o.complete);
		if (!inc.length) return null;
		return inc.reduce((a: any, b: any) => (a.progress / a.completionValue > b.progress / b.completionValue ? a : b));
	};

	const consistencyLabel = (record: any) => {
		const vals = completionValues(record);
		if (!vals.length) return null;
		const done = vals.filter((v) => v === 1).length;
		if (done === 0) return 'All need';
		if (done === vals.length) return 'All done';
		if (done === vals.length - 1) return 'One holdout';
		return 'Mixed';
	};

	const efficiencyLabel = (record: any) => {
		const t = timeToFinish(record);
		if (t < 1.5) return 'High value';
		if (t < 3) return 'Medium value';
		return 'Low value';
	};

	const findCollectionForRecord = (hash: string) => collections.find((c) => c.records.some((r) => r.hash === hash))?.hash;

	/* -------------------- Derived -------------------- */
	const allRecords = useMemo(() => Array.from(new Set(collections.flatMap((c) => c.records))), [collections]);
	const nearlyDoneRecords = useMemo(() => {
		return allRecords.filter((r) => {
			const score = completionScore(r);
			return score >= 0.1 && score < 1;
		});
	}, [allRecords, completionMode, fireteam]);

	const current = useMemo(() => {
		if (activeCollection === 'ALL') {
			return { hash: 'ALL', name: 'All Triumphs', records: allRecords };
		}

		if (activeCollection === '__NEARLY_DONE__') {
			return { hash: '__NEARLY_DONE__', name: 'Nearly Done', records: nearlyDoneRecords };
		}

		return collections.find((c) => c.hash === activeCollection) ?? null;
	}, [activeCollection, collections, allRecords, nearlyDoneRecords]);

	const displayedRecords = useMemo(() => {
		if (!current) return [];

		let list = current.records;

		if (search) list = list.filter((r) => r.displayProperties.name.toLowerCase().includes(search.toLowerCase()));
		if (hideCompleted) list = list.filter((r) => completionScore(r) < 1);

		list = [...list].sort((a, b) => {
			if (sortMode === 'time') return timeToFinish(a) - timeToFinish(b);
			return completionScore(b) - completionScore(a);
		});

		if (targeted) list = list.sort((a) => (a.hash === targeted ? -1 : 1));

		return list;
	}, [current, search, hideCompleted, sortMode, completionMode, targeted, fireteam]);

	/* -------------------- Progress Tracking -------------------- */
	useEffect(() => {
		displayedRecords.forEach((r) => {
			const score = completionScore(r);
			const prev = previousScores.current[r.hash] ?? score;
			if (score > prev) {
				setHighlightRecord(r.hash);
				lastUpdated.current[r.hash] = Date.now();
			}
			previousScores.current[r.hash] = score;
		});
	}, [displayedRecords]);

	useEffect(() => {
		if (!highlightRecord) return;
		const t = setTimeout(() => setHighlightRecord(null), 900);
		return () => clearTimeout(t);
	}, [highlightRecord]);

	const sidebarCollections = useMemo(() => {
		const allEntry = { hash: 'ALL', name: 'All', records: allRecords };

		const nearlyDoneEntry =
			nearlyDoneRecords.length > 0
				? {
						hash: '__NEARLY_DONE__',
						name: 'Nearly Done',
						records: nearlyDoneRecords,
				  }
				: null;

		const rest = collections
			.map((c) => ({
				...c,
				_pct: c.records.reduce((s, r) => s + completionScore(r), 0) / Math.max(c.records.length, 1),
			}))
			.sort((a, b) => b._pct - a._pct);

		return [allEntry, ...(nearlyDoneEntry ? [nearlyDoneEntry] : []), ...rest];
	}, [collections, allRecords, nearlyDoneRecords, completionMode, fireteam]);

	if (loading || fireteamLoading)
		return (
			<div className='p-6 text-neutral-400'>
				<Loader />
			</div>
		);

	return (
		<div className='min-h-screen flex bg-neutral-950 text-neutral-100 relative'>
			<div className='pointer-events-none absolute inset-0 bg-linear-to-b from-purple-900/20 via-transparent to-transparent' />

			{/* SIDEBAR */}
			<aside
				className='fixed left-0 top-0 w-72 h-screen overflow-y-auto bg-neutral-900 border-r border-neutral-800 p-2 space-y-1 z-20'
				style={{
					top: 'var(--header-h)',
					height: 'calc(100vh - var(--header-h))',
				}}>
				{sidebarCollections.map((c) => {
					const pct = Math.round((c.records.reduce((s, r) => s + completionScore(r), 0) / Math.max(c.records.length, 1)) * 100);

					return (
						<button
							key={c.hash}
							onClick={() => setActiveCollection(c.hash)}
							className={`relative w-full px-3 py-2 pl-4 rounded-xl text-left transition overflow-hidden ${
								activeCollection === c.hash || highlightCollection === c.hash ? 'bg-purple-500/10 ring-1 ring-purple-500' : 'hover:bg-purple-500/10'
							}`}>
							{/* CLICK TARGET INDICATOR */}
							{highlightCollection === c.hash && (
								<>
									<span className='absolute left-0 top-0 h-full w-1 bg-purple-500 rounded-r animate-pulse' />
									<span className='pointer-events-none absolute inset-0 bg-linear-to-r from-purple-500/25 to-transparent' />
								</>
							)}

							<div className='flex justify-between text-sm'>
								<span className='truncate'>{c.name}</span>
								<span className='text-neutral-400'>{pct}%</span>
							</div>
							<div className='h-1 bg-neutral-800 rounded overflow-hidden'>
								<div className='h-full bg-purple-500 transition-[width] duration-700' style={{ width: `${pct}%` }} />
							</div>
						</button>
					);
				})}
			</aside>

			{/* MAIN */}
			<main className='relative flex-1 p-6'>
				<div className='max-w-6xl mx-auto space-y-6'>
					{/* HEADER */}
					<div className='flex flex-wrap justify-between items-center gap-2'>
						<h1 className='text-2xl font-semibold'>{current?.name}</h1>
						<div className='flex gap-2 flex-wrap'>
							<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search…' className='bg-neutral-800 px-3 py-1 rounded text-sm' />
							<button onClick={() => setHideCompleted((v) => !v)} className='bg-neutral-800 px-3 py-1 rounded text-sm'>
								{hideCompleted ? 'Show Completed' : 'Hide Completed'}
							</button>
							<select value={completionMode} onChange={(e) => setCompletionMode(e.target.value as any)} className='bg-neutral-800 px-2 py-1 rounded text-sm'>
								<option value='avg'>Average</option>
								<option value='worst'>Worst</option>
								<option value='best'>Best</option>
							</select>
							<select value={sortMode} onChange={(e) => setSortMode(e.target.value as any)} className='bg-neutral-800 px-2 py-1 rounded text-sm'>
								<option value='completion'>By completion</option>
								<option value='time'>By time-to-finish</option>
							</select>
						</div>
					</div>

					{/* TRIUMPHS */}
					<div className='space-y-4'>
						<AnimatePresence>
							{displayedRecords.slice(0, visibleCount).map((r) => {
								const pct = Math.round(completionScore(r) * 100);
								const vals = completionValues(r);

								const min = vals.length ? Math.min(...vals) * 100 : 0;
								const max = vals.length ? Math.max(...vals) * 100 : 0;
								const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) * 100 : 0;
								const showVariance = vals.length > 1 && Math.round(min) !== Math.round(max);

								return (
									<motion.div
										key={r.hash}
										ref={(el) => {
											recordRefs.current[r.hash] = el;
										}}
										layout
										exit={{ opacity: 0, y: -8 }}
										className={`relative bg-neutral-900 rounded-2xl overflow-hidden border transition-all duration-300 ${
											targeted === r.hash
												? 'border-purple-500 ring-4 ring-purple-500/40 shadow-[0_0_40px_rgba(139,92,246,0.6)] scale-[1.04]'
												: highlightRecord === r.hash
												? 'border-purple-500/60 ring-2 ring-purple-500/30'
												: 'border-neutral-800 hover:border-neutral-700'
										}`}>
										<div
											className='p-4 flex gap-4 cursor-pointer'
											onClick={() => {
												const col = findCollectionForRecord(r.hash);
												if (col) {
													setActiveCollection(col);
													setTargeted(r.hash);
													setHighlightRecord(r.hash);

													setTimeout(() => {
														setHighlightRecord(null);
														setTargeted(null);
													}, 1400);
												}
											}}>
											<img src={`https://bungie.net${r.displayProperties.icon}`} className='w-12 h-12 rounded bg-neutral-800' />
											<div className='flex-1'>
												<h2 className='font-medium flex gap-2'>
													{r.displayProperties.name}
													<button onClick={(e) => (e.stopPropagation(), setTargeted((t) => (t === r.hash ? null : r.hash)))} className='text-xs text-neutral-400'>
														{targeted === r.hash ? '★' : '☆'}
													</button>
												</h2>
												<p className='text-sm text-neutral-400'>{r.displayProperties.description}</p>
												<p className='text-xs text-neutral-500 mt-1'>
													{efficiencyLabel(r)} · {consistencyLabel(r)}
												</p>
											</div>
											<div className='text-sm'>{pct}%</div>
										</div>

										{showVariance && (
											<div className='px-4 pb-2'>
												<div className='relative h-1 bg-neutral-800 rounded'>
													<div className='absolute h-full bg-purple-400' style={{ left: `${min}%`, width: `${max - min}%` }} />
													<div className='absolute h-2 w-2 bg-white rounded-full -top-0.5' style={{ left: `${avg}%` }} />
												</div>
											</div>
										)}

										{/* FIRETEAM */}
										<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 px-4 pb-4'>
											{fireteam.map((m: any, i) => {
												const rec = m.profile?.profileRecords?.data?.records?.[r.hash];
												const objectives = rec?.objectives ?? [];
												const bg = m.character?.emblemBackgroundPath ? `https://bungie.net${m.character.emblemBackgroundPath}` : undefined;

												return (
													<div key={i} className='relative rounded-lg overflow-hidden group'>
														{bg && <div className='absolute inset-0 bg-cover bg-center opacity-30' style={{ backgroundImage: `url(${bg})` }} />}
														<div className='relative z-10 bg-neutral-900/80 px-3 py-2 flex items-center gap-3 group-hover:opacity-50'>
															<span className='flex-1 truncate text-sm'>{m.profile?.profile?.data?.userInfo?.bungieGlobalDisplayName}</span>
															<div className='flex gap-1'>
																{objectives.map((o: any, j: number) => (
																	<span key={j} title={objectiveDefs[o.objectiveHash]?.displayProperties?.description} className={`text-xs ${o.complete ? 'text-emerald-400' : 'text-neutral-500'}`}>
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
											<div className='h-full bg-purple-500 transition-[width] duration-700' style={{ width: `${pct}%` }} />
										</div>
									</motion.div>
								);
							})}
						</AnimatePresence>

						{visibleCount < displayedRecords.length && (
							<div className='flex justify-center pt-6'>
								<button onClick={() => setVisibleCount((v) => v + PAGE_SIZE)} className='px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition'>
									Load more
								</button>
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}

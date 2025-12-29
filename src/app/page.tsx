/** @format */
'use client';

export default function Home() {
	return (
		<div className='min-h-screen bg-neutral-950 text-neutral-100 font-sans'>
			{/* HERO */}
			<section className='relative overflow-hidden'>
				<div className='absolute inset-0 bg-gradient-to-b from-purple-900/20 via-neutral-950 to-neutral-950' />
				<div className='relative max-w-6xl mx-auto px-6 pt-28 pb-20 text-center'>
					<h1 className='text-6xl font-extrabold tracking-tight text-white'>
						Dummi<span className='text-purple-400'>.me</span>
					</h1>

					<p className='mt-6 max-w-2xl mx-auto text-lg text-neutral-300 leading-relaxed'>
						A Destiny 2 triumph tracker built for fireteams. Sign in with Bungie, load your data live, and log out knowing nothing was stored.
					</p>

					<div className='mt-10 flex justify-center gap-4'>
						<a href='/triumphs' className='px-8 py-4 rounded-xl bg-purple-600 text-white font-semibold shadow-lg hover:bg-purple-500 transition'>
							Open Triumphs
						</a>

						<a href='/vault' className='px-8 py-4 rounded-xl bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition'>
							View Vault
						</a>
					</div>
				</div>
			</section>

			{/* FEATURES */}
			<section className='max-w-6xl mx-auto px-6 py-24'>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
					<div className='bg-neutral-900 rounded-2xl p-6 border border-neutral-800'>
						<h3 className='text-lg font-semibold text-purple-400 mb-2'>Fireteam Focused</h3>
						<p className='text-sm text-neutral-400 leading-relaxed'>See triumph progress across your entire fireteam. Completion percentages, objective states, and who’s closest to finishing what.</p>
					</div>

					<div className='bg-neutral-900 rounded-2xl p-6 border border-neutral-800'>
						<h3 className='text-lg font-semibold text-purple-400 mb-2'>Zero Storage</h3>
						<p className='text-sm text-neutral-400 leading-relaxed'>You authenticate with Bungie, data is fetched live, and nothing is saved. No database, no caching, no history kept.</p>
					</div>

					<div className='bg-neutral-900 rounded-2xl p-6 border border-neutral-800'>
						<h3 className='text-lg font-semibold text-purple-400 mb-2'>Manifest Accurate</h3>
						<p className='text-sm text-neutral-400 leading-relaxed'>All triumphs and objectives are resolved using the live Destiny manifest. What you see is exactly what the game tracks.</p>
					</div>
				</div>
			</section>

			{/* FOOTER CTA */}
			<section className='border-t border-neutral-800'>
				<div className='max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-6'>
					<div>
						<h2 className='text-2xl font-bold'>Check your progress</h2>
						<p className='text-neutral-400 text-sm mt-1'>Live data, real percentages, no persistence.</p>
					</div>

					<a href='/triumphs' className='px-7 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition'>
						Launch Triumphs
					</a>
				</div>
			</section>
		</div>
	);
}

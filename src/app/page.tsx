/** @format */
'use client';

export default function Home() {
	return (
		<div className='flex min-h-screen flex-col bg-neutral-950 text-neutral-100 font-sans p-6'>
			{/* Page Title */}
			<h1 className='text-5xl font-extrabold tracking-tight mb-6 text-center text-purple-400'>Welcome to Dummi.me</h1>

			{/* Project Description */}
			<p className='max-w-3xl mx-auto text-center text-neutral-300 mb-12 text-lg leading-relaxed'>
				Dive into your Destiny 2 adventure with a personalized triumph tracker. This is my first-ever project interacting with the Bungie API. While all data stays on your device and no caching is
				performed, it means load times can be a little longer—but it also guarantees your progress is completely private. Track your triumphs, compare with your fireteam, and see who’s leading the
				way.
			</p>

			{/* Centered Card */}
			<div className='flex flex-1 items-center justify-center'>
				<div className='bg-neutral-900 rounded-3xl shadow-2xl p-10 flex flex-col items-center gap-6 w-full max-w-sm'>
					<p className='text-neutral-400 text-center text-sm'>Track your own and your fireteam's Destiny 2 triumphs in one clean dashboard.</p>

					<a href='/triumphs' className='w-full text-center px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold text-sm shadow-lg hover:bg-purple-500 transition'>
						Open Triumphs Tracker
					</a>
				</div>
			</div>
		</div>
	);
}

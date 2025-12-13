/** @format */
'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

import { useState } from 'react';

export default function Header() {
	const { data: session } = useSession() as unknown as Record<string, any>;
	const [dropdown, setDropdown] = useState(false);

	return (
		<header className='sticky top-0 z-50 flex items-center justify-between p-4 bg-neutral-900 text-neutral-100 shadow-md rounded-b-2xl'>
			<h1 className='text-2xl font-bold tracking-tight'>
				<a href='/'>Dummi.me</a>
			</h1>

			<nav className='relative'>
				<ul className='flex items-center gap-6'>
					<li>
						<a href='/triumphs' className='text-sm font-medium text-neutral-300 hover:text-white transition'>
							Triumphs Tracker
						</a>
					</li>

					<li className='relative'>
						{session ? (
							<button onClick={() => setDropdown(!dropdown)} className='text-sm font-medium text-neutral-300 hover:text-white transition'>
								{session?.user?.uniqueName}
							</button>
						) : (
							<button onClick={() => signIn()} className='text-sm font-medium px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition'>
								Login
							</button>
						)}

						{dropdown && session && (
							<ul className='absolute right-0 mt-2 w-36 bg-neutral-800 rounded-xl shadow-lg overflow-hidden z-50'>
								<li>
									<button className='w-full text-left px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700 transition'>Profile (Soon)</button>
								</li>
								<li>
									<button onClick={() => signOut()} className='w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-neutral-700 transition'>
										Log Out
									</button>
								</li>
							</ul>
						)}
					</li>
				</ul>
			</nav>
		</header>
	);
}

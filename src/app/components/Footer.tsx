/** @format */
'use client';

export default function Footer() {
	return (
		<footer className='bg-neutral-900 text-neutral-300 p-6 mt-12 rounded-t-2xl shadow-inner'>
			<div className='max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4'>
				{/* Left Section: Links */}
				<div className='flex gap-4 flex-wrap justify-center'>
					<a href='https://dummi.me/discord' target='_blank' rel='noopener noreferrer' className='hover:text-white transition text-sm'>
						Discord
					</a>
					<a href='https://github.com/TheDummi/d2.dummi.me' target='_blank' rel='noopener noreferrer' className='hover:text-white transition text-sm'>
						GitHub
					</a>
					<a href='/privacy' className='hover:text-white transition text-sm'>
						Privacy Policy
					</a>
					<a href='/terms' className='hover:text-white transition text-sm'>
						Terms of Service
					</a>
				</div>

				{/* Right Section: Copyright */}
				<div className='text-sm text-neutral-500 text-center md:text-right'>&copy; {new Date().getFullYear()} Dummi.me. All rights reserved.</div>
			</div>

			{/* Optional: small secondary text */}
			<div className='mt-4 text-xs text-neutral-600 text-center'>Made by Dummi#5553</div>
		</footer>
	);
}

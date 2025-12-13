/** @format */
'use client';

export default function Privacy() {
	const lastUpdated = new Date(1765641854644).toLocaleString(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	});

	return (
		<div className='min-h-screen bg-neutral-950 text-neutral-100 font-sans p-6 flex flex-col items-center'>
			<div className='max-w-4xl w-full bg-neutral-900 rounded-2xl shadow-xl p-8 flex flex-col gap-6'>
				<h1 className='text-3xl font-bold tracking-tight text-center'>Privacy Policy</h1>

				<p className='text-neutral-400 text-sm'>{lastUpdated}</p>

				<p className='text-neutral-400 text-sm'>At Dummi.me, your privacy is our top priority. We want to be transparent about the data we collect, how it is stored, and your rights.</p>

				<h2 className='text-xl font-semibold mt-4'>Data Storage</h2>
				<p className='text-neutral-400 text-sm'>
					No data is stored on any cloud service. Any data you provide or track is stored locally on your device. We do not collect, share, or sell your personal information.
				</p>

				<h2 className='text-xl font-semibold mt-4'>Authentication & Cookies</h2>
				<p className='text-neutral-400 text-sm'>
					Dummi.me uses Bungie authentication to allow you to log in. This requires cookies to store your session information. These cookies are only used for authentication and are stored in your
					browser. No additional personal data is collected or stored by us.
				</p>

				<h2 className='text-xl font-semibold mt-4'>Open Source</h2>
				<p className='text-neutral-400 text-sm'>
					This project is fully open source. You can view the source code on GitHub:
					<a href='https://github.com/TheDummi/d2.dummi.me' target='_blank' rel='noopener noreferrer' className='text-purple-500 hover:underline ml-1'>
						GitHub Repository
					</a>
				</p>

				<h2 className='text-xl font-semibold mt-4'>Third-Party Services</h2>
				<p className='text-neutral-400 text-sm'>
					We do not use any other third-party services that store personal data. Links to external sites, like Discord or GitHub, are provided for convenience.
				</p>

				<h2 className='text-xl font-semibold mt-4'>Your Rights</h2>
				<p className='text-neutral-400 text-sm'>
					You have full control over your data. Since all other data is stored locally on your device, you can delete it anytime. We do not have access to any of your personal information.
				</p>

				<h2 className='text-xl font-semibold mt-4'>Updates to this Policy</h2>
				<p className='text-neutral-400 text-sm'>We may update this privacy policy occasionally to reflect changes in the project. Changes will be posted here with the updated date.</p>

				<p className='text-neutral-500 text-xs text-center mt-6'>&copy; {new Date().getFullYear()} Dummi.me. All rights reserved.</p>
			</div>
		</div>
	);
}

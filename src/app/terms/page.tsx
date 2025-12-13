/** @format */
'use client';

export default function TermsOfService() {
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
				<h1 className='text-3xl font-bold tracking-tight text-center'>Terms of Service</h1>

				<p className='text-neutral-400 text-sm'>{lastUpdated}</p>

				<p className='text-neutral-400 text-sm'>By signing in to Dummi.me, you agree to the following terms of service. Please read them carefully.</p>

				<h2 className='text-xl font-semibold mt-4'>1. Acceptance of Terms</h2>
				<p className='text-neutral-400 text-sm'>
					By accessing or using Dummi.me, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you must not use the service.
				</p>

				<h2 className='text-xl font-semibold mt-4'>2. Use of Service</h2>
				<p className='text-neutral-400 text-sm'>
					Dummi.me is intended for tracking Destiny 2 triumphs and fireteam progress. You agree to use the service only for lawful purposes and in a manner that does not infringe the rights of others
					or restrict their use of the service.
				</p>

				<h2 className='text-xl font-semibold mt-4'>3. User Accounts</h2>
				<p className='text-neutral-400 text-sm'>
					To use certain features, you must sign in with your Bungie account. You are responsible for maintaining the confidentiality of your login credentials. Signing in constitutes your agreement
					to these terms.
				</p>

				<h2 className='text-xl font-semibold mt-4'>4. Data Storage</h2>
				<p className='text-neutral-400 text-sm'>
					All personal tracking data is stored locally on your device. Authentication cookies are required for login. We do not collect or store your personal data beyond what is necessary for
					authentication.
				</p>

				<h2 className='text-xl font-semibold mt-4'>5. Intellectual Property</h2>
				<p className='text-neutral-400 text-sm'>
					All content on Dummi.me, including code, graphics, and text, is the property of the site owner unless otherwise stated. You may not copy, reproduce, or distribute any content without
					explicit permission.
				</p>

				<h2 className='text-xl font-semibold mt-4'>6. Third-Party Links</h2>
				<p className='text-neutral-400 text-sm'>
					Links to external websites, such as Discord or GitHub, are provided for convenience. We are not responsible for the content or privacy practices of these sites.
				</p>

				<h2 className='text-xl font-semibold mt-4'>7. Termination</h2>
				<p className='text-neutral-400 text-sm'>We reserve the right to suspend or terminate access to Dummi.me for any user who violates these Terms of Service.</p>

				<h2 className='text-xl font-semibold mt-4'>8. Disclaimer of Warranties</h2>
				<p className='text-neutral-400 text-sm'>Dummi.me is provided "as is" without warranties of any kind, either express or implied. We do not guarantee uninterrupted or error-free service.</p>

				<h2 className='text-xl font-semibold mt-4'>9. Limitation of Liability</h2>
				<p className='text-neutral-400 text-sm'>In no event shall Dummi.me or its owner be liable for any damages arising from your use of the service.</p>

				<h2 className='text-xl font-semibold mt-4'>10. Changes to Terms</h2>
				<p className='text-neutral-400 text-sm'>We may update these Terms of Service occasionally. Continued use of Dummi.me after changes constitutes your acceptance of the new terms.</p>

				<p className='text-neutral-500 text-xs text-center mt-6'>&copy; {new Date().getFullYear()} Dummi.me. All rights reserved.</p>
			</div>
		</div>
	);
}

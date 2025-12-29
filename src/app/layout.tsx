/** @format */

import './globals.css';

import { CharacterProvider } from './components/CharacterProvider';
import { FireteamProvider } from './components/FireteamProvider';
import Footer from './components/Footer';
import Header from './components/Header';
import type { Metadata } from 'next';
import SessionProvider from '@/app/components/SessionProvider';
import { authOptions } from './api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

export const metadata: Metadata = {
	title: {
		default: 'Dummi.me',
		template: '%s • Dummi.me',
	},
	description: 'Destiny 2 data visualization, triumph tracking, fireteam analysis, and player insights.',
	applicationName: 'Dummi.me',
	authors: [{ name: 'Dummi' }],
	creator: 'Dummi',
	publisher: 'Dummi',

	metadataBase: new URL('https://dummi.me'),

	icons: {
		icon: '/icons/favicon.png',
		shortcut: '/icons/favicon.png',
		apple: '/icons/apple-touch-icon.png',
	},

	openGraph: {
		type: 'website',
		url: 'https://dummi.me',
		title: 'Dummi.me',
		description: 'Destiny 2 data visualization, triumph tracking, fireteam analysis, and player insights.',
		siteName: 'Dummi.me',
		images: [
			{
				url: '/og/og-image.png',
				width: 1200,
				height: 630,
				alt: 'Dummi.me — Destiny 2 stats and triumph tracking',
			},
		],
	},

	twitter: {
		card: 'summary_large_image',
		title: 'Dummi.me',
		description: 'Destiny 2 data visualization, triumph tracking, fireteam analysis, and player insights.',
		images: ['/og/og-image.png'],
	},

	robots: {
		index: true,
		follow: true,
		googleBot: {
			'index': true,
			'follow': true,
			'max-image-preview': 'large',
			'max-snippet': -1,
			'max-video-preview': -1,
		},
	},

	category: 'gaming',
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await getServerSession(authOptions);

	return (
		<html lang='en'>
			<body className={``}>
				<SessionProvider session={session}>
					<CharacterProvider>
						<FireteamProvider>
							<Header />
							{children}
							<Footer />
						</FireteamProvider>
					</CharacterProvider>
				</SessionProvider>
			</body>
		</html>
	);
}

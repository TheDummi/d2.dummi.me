/** @format */

import './globals.css';

import Footer from './components/Footer';
import Header from './components/Header';
import type { Metadata } from 'next';
import SessionProvider from '@/app/components/SessionProvider';
import { authOptions } from './api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

export const metadata: Metadata = {
	title: 'Dummi.me',
	description: 'D2 data visualization and analysis platform.',
	icons: '/icons/favicon.png',
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
					<Header />
					{children}
					<Footer />
				</SessionProvider>
			</body>
		</html>
	);
}

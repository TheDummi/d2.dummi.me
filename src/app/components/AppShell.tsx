/** @format */

'use client';

import { useEffect, useRef, useState } from 'react';

import Header from '@/app/components/Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
	const headerRef = useRef<HTMLElement | null>(null);
	const [headerHeight, setHeaderHeight] = useState(0);

	useEffect(() => {
		if (!headerRef.current) return;

		const update = () => {
			setHeaderHeight(headerRef.current!?.offsetHeight);
		};

		update();

		const ro = new ResizeObserver(update);
		ro.observe(headerRef.current);

		return () => ro.disconnect();
	}, []);

	useEffect(() => {
		document.documentElement.style.setProperty('--header-h', `${headerHeight}px`);
	}, [headerHeight]);

	return (
		<div className='h-full overflow-hidden'>
			<header ref={headerRef} className='fixed top-0 z-50 w-full'>
				<Header />
			</header>

			<div className='mt-35'>{children}</div>
		</div>
	);
}

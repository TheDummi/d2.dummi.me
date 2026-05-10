/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';

import ItemCard from './ItemCard';

type Props = {
	open: boolean;

	onClose: () => void;

	label: string;

	items: any[];

	loading?: boolean;

	reverse?: boolean;
};

export default function VaultDrawer({
	open,

	onClose,

	label,

	items,

	loading = false,

	reverse = false,
}: Props) {
	return (
		<AnimatePresence>
			{open && (
				<>
					{/* Backdrop */}

					<motion.div
						initial={{
							opacity: 0,
						}}
						animate={{
							opacity: 1,
						}}
						exit={{
							opacity: 0,
						}}
						onClick={onClose}
						className='fixed inset-0 z-40 bg-black/70 backdrop-blur-sm'
					/>

					{/* Drawer */}

					<motion.div
						initial={{
							x: reverse ? 60 : -60,
							opacity: 0,
							scale: 0.98,
						}}
						animate={{
							x: 0,
							opacity: 1,
							scale: 1,
						}}
						exit={{
							x: reverse ? 60 : -60,
							opacity: 0,
							scale: 0.98,
						}}
						transition={{
							duration: 0.25,
							ease: [0.22, 1, 0.36, 1],
						}}
						className={`fixed top-6 bottom-6 z-50 rounded-[2rem] border border-white/10 bg-[#0f1115]/95 backdrop-blur-2xl overflow-hidden ${reverse ? 'right-6' : 'left-6'}`}
						style={{
							width: 'calc(100vw - 380px)',
						}}>
						{/* Background glow */}

						<div className='absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none' />

						{/* Header */}

						<div className='relative flex items-center justify-between px-6 py-5 border-b border-white/10'>
							<div>
								<div className='text-[10px] uppercase tracking-[0.35em] text-white/40 mb-1'>Inventory Vault</div>

								<h2 className='text-3xl font-black tracking-tight'>{label}</h2>
							</div>

							<button
								onClick={onClose}
								className='w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition flex items-center justify-center text-white/60 hover:text-white'>
								✕
							</button>
						</div>

						{/* Content */}

						<div className='relative p-6 h-[calc(100%-96px)] overflow-y-auto'>
							{loading ? (
								<div className='grid grid-cols-8 gap-3'>
									{Array.from({ length: 40 }).map((_, i) => (
										<div key={i} className='aspect-square rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse' />
									))}
								</div>
							) : items.length ? (
								<div className='grid grid-cols-8 gap-3'>
									{items.map((item) => (
										<ItemCard key={item.itemInstanceId ?? item.itemHash} item={item} showName />
									))}
								</div>
							) : (
								<div className='h-full flex items-center justify-center text-white/30 text-sm'>This vault section is empty. Humanity hoards everything except organization.</div>
							)}
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

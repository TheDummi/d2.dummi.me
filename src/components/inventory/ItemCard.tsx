/** @format */

'use client';

import { motion } from 'framer-motion';

type Props = {
	item?: any;

	size?: 'sm' | 'md' | 'lg';

	equipped?: boolean;

	showName?: boolean;

	showPower?: boolean;

	className?: string;
};

export default function ItemCard({
	item,

	size = 'md',

	equipped = false,

	showName = false,

	showPower = true,

	className = '',
}: Props) {
	const rarityStyles: Record<string, string> = {
		Exotic: 'border-yellow-400/60 bg-yellow-500/10',
		Legendary: 'border-purple-400/50 bg-purple-500/10',
		Rare: 'border-blue-400/50 bg-blue-500/10',
		Common: 'border-gray-400/30 bg-white/5',
	};

	const sizes = {
		sm: 'w-14 h-14 rounded-xl',
		md: 'w-16 h-16 rounded-2xl',
		lg: 'w-20 h-20 rounded-2xl',
	};

	const power = item?.instanceData?.primaryStat?.value || item?.primaryStat?.value;

	return (
		<motion.div
			whileHover={{
				scale: 1.04,
				y: -2,
			}}
			transition={{
				duration: 0.15,
			}}
			className={`
				group
				relative
				overflow-hidden
				border
				backdrop-blur-xl
				${sizes[size]}
				${rarityStyles[item?.inventory?.tierTypeName] || 'border-white/10 bg-black/30'}
				${equipped ? 'ring-2 ring-white/30' : ''}
				${className}
			`}>
			{/* Icon */}

			{item?.displayProperties?.icon ? (
				<img src={`https://www.bungie.net${item.displayProperties.icon}`} alt={item.displayProperties.name} className='w-full h-full object-cover' />
			) : (
				<div className='w-full h-full bg-white/5 flex items-center justify-center text-[10px] text-white/20'>?</div>
			)}

			{/* Dark gradient */}

			<div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent' />

			{/* Equipped marker */}

			{equipped && <div className='absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold uppercase tracking-wide'>E</div>}

			{/* Power */}

			{showPower && power && <div className='absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold'>{power}</div>}

			{/* Name overlay */}

			{showName && item?.displayProperties?.name && (
				<div className='absolute inset-x-0 bottom-0 p-2 bg-black/80 backdrop-blur-sm'>
					<div className='text-[11px] font-semibold leading-tight truncate'>{item.displayProperties.name}</div>

					<div className='text-[10px] text-white/50 truncate mt-0.5'>{item.itemTypeDisplayName}</div>
				</div>
			)}

			{/* Hover glow */}

			<div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-white/[0.03]' />
		</motion.div>
	);
}

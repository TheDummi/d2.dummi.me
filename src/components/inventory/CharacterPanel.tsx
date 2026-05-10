/** @format */

'use client';

import { motion } from 'framer-motion';

type Props = {
	character: any;

	subclass?: any;
};

export default function CharacterPanel({
	character,

	subclass,
}: Props) {
	const className = character.classType === 0 ? 'Titan' : character.classType === 1 ? 'Hunter' : 'Warlock';

	return (
		<div className='relative w-[360px] h-[640px] rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-2xl'>
			{/* Background */}

			{character.emblemBackgroundPath && (
				<motion.img
					initial={{
						scale: 1.08,
						opacity: 0,
					}}
					animate={{
						scale: 1,
						opacity: 0.45,
					}}
					transition={{
						duration: 0.8,
					}}
					src={`https://www.bungie.net${character.emblemBackgroundPath}`}
					className='absolute inset-0 w-full h-full object-cover'
				/>
			)}

			{/* Overlays */}

			<div className='absolute inset-0 bg-gradient-to-t from-[#0b0d11] via-[#0b0d11]/70 to-black/20' />

			<div className='absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent' />

			{/* Floating glow */}

			<div className='absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-white/10 blur-3xl opacity-20' />

			{/* Content */}

			<div className='relative h-full flex flex-col justify-between p-6'>
				{/* Top */}

				<div>
					<div className='text-[10px] uppercase tracking-[0.35em] text-white/40 mb-2'>Guardian</div>

					<h1 className='text-4xl font-black tracking-tight leading-none'>{className}</h1>

					<div className='mt-3 flex items-center gap-2'>
						<div className='px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-white/70'>Power {character.light}</div>

						{subclass?.name && <div className='px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-white/70'>{subclass.name}</div>}
					</div>
				</div>

				{/* Center silhouette placeholder */}

				<div className='flex-1 flex items-center justify-center'>
					<div className='relative'>
						<div className='w-52 h-52 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-xl flex items-center justify-center'>
							<div className='text-center'>
								<div className='text-7xl font-black leading-none'>{character.light}</div>

								<div className='mt-3 text-[10px] uppercase tracking-[0.35em] text-white/40'>Power</div>
							</div>
						</div>

						{/* Orbit rings */}

						<div className='absolute inset-[-20px] rounded-full border border-white/5' />

						<div className='absolute inset-[-40px] rounded-full border border-white/[0.03]' />
					</div>
				</div>

				{/* Bottom */}

				<div className='rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4'>
					<div className='text-[10px] uppercase tracking-[0.25em] text-white/40 mb-3'>Current Subclass</div>

					<div className='flex items-center gap-4'>
						<div className='w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-white/5'>
							{subclass?.icon ? (
								<img src={`https://www.bungie.net${subclass.icon}`} className='w-full h-full object-cover' />
							) : (
								<div className='w-full h-full flex items-center justify-center text-white/20'>?</div>
							)}
						</div>

						<div>
							<div className='text-lg font-bold'>{subclass?.name || 'Unknown'}</div>

							<div className='text-sm text-white/50 mt-1'>{subclass?.damageType || 'Light'}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

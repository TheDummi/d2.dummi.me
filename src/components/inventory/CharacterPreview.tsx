/** @format */

'use client';

import { motion } from 'framer-motion';

type Props = {
	character: any;

	emblem?: string;
};

export default function CharacterPreview({ character, emblem }: Props) {
	return (
		<motion.div
			initial={{
				opacity: 0,
				scale: 0.96,
			}}
			animate={{
				opacity: 1,
				scale: 1,
			}}
			transition={{
				duration: 0.35,
			}}
			className='relative w-[360px] h-[720px] rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-2xl'>
			{/* Background */}

			{emblem && <img src={`https://bungie.net${emblem}`} alt='' className='absolute inset-0 w-full h-full object-cover opacity-20 blur-2xl scale-110' />}

			<div className='absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-black/80' />

			{/* Glow */}

			<div className='absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none' />

			{/* Character */}

			<div className='relative h-full flex flex-col items-center justify-center px-6'>
				{/* Fake guardian silhouette until Bungie render support */}

				<div className='relative'>
					<div className='absolute inset-0 blur-3xl bg-white/10 rounded-full scale-125' />

					<div className='relative w-64 h-[34rem] rounded-[999px] border border-white/10 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-transparent backdrop-blur-xl flex items-center justify-center overflow-hidden'>
						<div className='absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]' />

						<div className='text-center px-6'>
							<div className='text-[10px] uppercase tracking-[0.35em] text-white/30 mb-4'>Guardian</div>

							<div className='text-2xl font-black mb-2'>{character?.classType === 0 ? 'Titan' : character?.classType === 1 ? 'Hunter' : 'Warlock'}</div>

							<div className='text-sm text-white/50'>Character preview coming later</div>

							<div className='mt-6 text-xs text-white/30 leading-relaxed'>Bungie still treats full character rendering like forbidden golden-age technology.</div>
						</div>
					</div>
				</div>

				{/* Footer info */}

				<div className='absolute bottom-8 left-8 right-8'>
					<div className='rounded-3xl border border-white/10 bg-black/30 backdrop-blur-2xl p-5'>
						<div className='flex items-end justify-between'>
							<div>
								<div className='text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2'>Power</div>

								<div className='text-5xl font-black tracking-tight'>{character?.light || '0'}</div>
							</div>

							<div className='text-right'>
								<div className='text-sm text-white/50'>Last Played</div>

								<div className='text-sm font-medium'>{character?.dateLastPlayed ? new Date(character.dateLastPlayed).toLocaleDateString() : 'Unknown'}</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</motion.div>
	);
}

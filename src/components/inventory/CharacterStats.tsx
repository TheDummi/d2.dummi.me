/** @format */

'use client';

import { motion } from 'framer-motion';

type Props = {
	character: any;
};

const STAT_HASHES = {
	health: 392767087,
	melee: 4244567218,
	grenade: 1735777505,
	classAbility: 144602215,
	super: 1943323491,
	weapons: 2996146975,
};

export default function CharacterStats({ character }: Props) {
	const stats = [
		{
			label: 'Health',
			value: character.stats[STAT_HASHES.health],
		},
		{
			label: 'Melee',
			value: character.stats[STAT_HASHES.melee],
		},
		{
			label: 'Grenade',
			value: character.stats[STAT_HASHES.grenade],
		},
		{
			label: 'Class',
			value: character.stats[STAT_HASHES.classAbility],
		},
		{
			label: 'Super',
			value: character.stats[STAT_HASHES.super],
		},
		{
			label: 'Weapons',
			value: character.stats[STAT_HASHES.weapons],
		},
	];

	return (
		<div className='relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-5'>
			{/* Glow */}

			<div className='absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none' />

			<div className='relative'>
				{/* Header */}

				<div className='mb-6'>
					<div className='text-[10px] uppercase tracking-[0.35em] text-white/40 mb-2'>Guardian</div>

					<div className='flex items-end gap-3'>
						<div className='text-6xl font-black tracking-tight leading-none'>{character.light}</div>

						<div className='pb-1 text-sm uppercase tracking-[0.25em] text-yellow-300'>Power</div>
					</div>
				</div>

				{/* Stats */}

				<div className='grid gap-3'>
					{stats.map((stat, i) => (
						<motion.div
							key={stat.label}
							initial={{
								opacity: 0,
								y: 10,
							}}
							animate={{
								opacity: 1,
								y: 0,
							}}
							transition={{
								delay: i * 0.04,
							}}
							className='rounded-2xl border border-white/5 bg-black/20 p-3'>
							<div className='flex items-center justify-between mb-2'>
								<div className='text-xs uppercase tracking-[0.2em] text-white/40'>{stat.label}</div>

								<div className='text-lg font-black'>{stat.value}</div>
							</div>

							<div className='relative h-2 rounded-full bg-white/5 overflow-hidden'>
								<div
									className='absolute inset-y-0 left-0 rounded-full bg-white/70'
									style={{
										width: `${Math.min((stat.value / 200) * 100, 200)}%`,
									}}
								/>

								<div className='absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-40' />
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</div>
	);
}

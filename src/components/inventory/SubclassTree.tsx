/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { Info, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/app/providers/ToastProvider';

type Props = {
	subclass: any;

	build: any;

	onEquipItem?: (item: any, socketIndex: number) => Promise<void>;

	activeBuild?: any;

	onClose?: () => void;
};

const SOCKET_INDEX: Record<string, number> = {
	super: 0,
	grenade: 1,
	melee: 2,
	classAbility: 3,
	movement: 4,

	aspect: 5,

	fragment: 7,
};

function AbilityNode({ item, active, large = false, onClick }: { item: any; active?: boolean; large?: boolean; onClick?: () => void }) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: item.hash,
		data: item,
	});

	const style = {
		transform: CSS.Translate.toString(transform),
	};

	return (
		<motion.button
			ref={setNodeRef}
			style={style}
			layout
			whileHover={{
				scale: 1.06,
				y: -2,
			}}
			whileTap={{
				scale: 0.96,
			}}
			onClick={onClick}
			className={`
				group relative flex items-center justify-center
				${large ? 'w-40 h-40' : 'w-24 h-24'}
				${isDragging ? 'opacity-0' : ''}
			`}
			{...listeners}
			{...attributes}>
			{/* Active Glow */}

			{active && <div className='absolute inset-0 rounded-full blur-3xl bg-white/10 scale-125' />}

			{/* Icon */}

			<img
				draggable={false}
				src={`https://www.bungie.net${item.icon}`}
				className={`
					relative z-10 object-contain transition-all duration-200
					${large ? 'w-[88%] h-[88%]' : 'w-[82%] h-[82%]'}
					${active ? 'opacity-100' : 'opacity-70'}
					group-hover:opacity-100
					drop-shadow-[0_0_22px_rgba(255,255,255,0.22)]
				`}
			/>
		</motion.button>
	);
}

function EquipDropZone({ children, id }: { children: React.ReactNode; id: string }) {
	const { setNodeRef, isOver } = useDroppable({
		id,
	});

	return (
		<div
			ref={setNodeRef}
			className={`
				relative transition-all duration-200
				${isOver ? 'scale-110 brightness-125' : ''}
			`}>
			{children}
		</div>
	);
}

export default function SubclassTree({ subclass, build, activeBuild, onEquipItem, onClose }: Props) {
	const { toast } = useToast();

	const [dragging, setDragging] = useState<any>(null);

	const [selectedItem, setSelectedItem] = useState<any>(null);

	const [optimisticBuild, setOptimisticBuild] = useState<any>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 4,
			},
		})
	);

	const displayedBuild = optimisticBuild || build?.equipped;

	const available = build?.available || {};

	const abilities = useMemo(() => {
		return {
			supers: available.supers || [],

			grenades: available.grenades || [],

			melees: available.melees || [],

			classAbilities: available.classAbilities || [],

			movements: available.movements || [],
		};
	}, [available]);

	const aspects = available.aspects || [];

	const fragments = available.fragments || [];

	async function handleEquip(item: any, slot?: string) {
		if (!onEquipItem) return;

		toast(`Equipping ${item.name}`, 'info');

		const previous = displayedBuild;

		const next = structuredClone(displayedBuild);

		switch (slot) {
			case 'super':
				next.super = item;
				break;

			case 'grenade':
				next.grenade = item;
				break;

			case 'melee':
				next.melee = item;
				break;

			case 'movement':
				next.movement = item;
				break;

			case 'classAbility':
				next.classAbility = item;
				break;

			case 'aspect':
				next.aspects = [item, ...next.aspects.filter((x: any) => x.hash !== item.hash)].slice(0, 2);
				break;

			case 'fragment':
				next.fragments = [item, ...next.fragments.filter((x: any) => x.hash !== item.hash)].slice(0, 4);
				break;
		}

		setOptimisticBuild(next);

		const socketIndex = SOCKET_INDEX[slot || 'super'];

		try {
			await onEquipItem(item, socketIndex);

			toast(`Equipped ${item.name}`, 'success');
		} catch (err) {
			toast(`Failed to equip ${item.name}`, 'error');

			setOptimisticBuild(previous);
		}
	}

	return (
		<div className=''>
			<DndContext
				sensors={sensors}
				onDragStart={({ active }) => {
					setDragging(active.data.current);
				}}
				onDragEnd={async ({ active, over }) => {
					if (!over) {
						setDragging(null);
						return;
					}

					const item = active.data.current;

					await handleEquip(item, String(over.id));

					setDragging(null);
				}}
				onDragCancel={() => {
					setDragging(null);
				}}>
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
					className='fixed inset-0 z-99999 overflow-hidden bg-black text-white'>
					<div className='absolute inset-0 rounded-[2.5rem] overflow-hidden'>
						<img src={`https://www.bungie.net${subclass.screenshot}`} className='w-full h-full object-cover opacity-30 blur-[2px]' />

						<div className='absolute inset-0 bg-black/55' />
					</div>

					{/* Header */}

					<div className='relative z-20 h-24 border-b border-white/10 backdrop-blur-md bg-black/20 px-10 flex items-center justify-between'>
						<div className='flex items-center gap-6'>
							<div className='w-14 h-14 rotate-45 border border-white/20 bg-white/[0.04] flex items-center justify-center shrink-0'>
								<img src={`https://www.bungie.net${subclass.displayProperties.icon}`} className='w-[72%] h-[72%] object-contain -rotate-45' />
							</div>

							<div>
								<div className='text-4xl font-black tracking-tight uppercase leading-none'>{subclass.displayProperties.name}</div>

								<div className='text-sm text-white/60 uppercase tracking-[0.25em] mt-2'>{subclass.itemTypeDisplayName}</div>
							</div>
						</div>

						<button onClick={onClose} className='w-12 h-12 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition flex items-center justify-center'>
							<X className='w-5 h-5' />
						</button>
					</div>

					{/* Tree Area */}

					{/* Tree Area */}

					<div className='relative z-10 h-[calc(100vh-96px)] overflow-y-auto px-16 py-12'>
						<div className='flex gap-20 items-start min-h-full'>
							{/* LEFT SUPER COLUMN */}

							<div className='w-[340px] shrink-0'>
								<div className='text-xl uppercase tracking-wide border-b border-white/20 pb-2 mb-8'>Supers</div>

								<div className='flex flex-col items-center gap-10'>
									{/* Equipped Super */}

									<EquipDropZone id={'super'}>
										<AbilityNode item={displayedBuild.super} large active onClick={() => setSelectedItem(displayedBuild.super)} />
									</EquipDropZone>

									{/* Available Supers */}

									<div className='grid grid-cols-2 gap-6'>
										{available.supers
											.filter((x: any) => x.hash !== displayedBuild.super?.hash)
											.map((item: any) => (
												<AbilityNode key={item.hash} item={item} onClick={() => setSelectedItem(item)} />
											))}
									</div>
								</div>
							</div>

							{/* RIGHT TREE */}

							<div className='flex-1 flex flex-col gap-24'>
								{/* EQUIPPED ABILITIES */}

								<div>
									<div className='text-xl uppercase tracking-wide border-b border-white/20 pb-2 mb-10'>Equipped</div>

									<div className='grid grid-cols-4 gap-10'>
										{/* Class */}

										<div className='flex flex-col items-center gap-5'>
											<div className='text-xs uppercase tracking-[0.25em] text-white/40'>Class</div>

											<EquipDropZone id={'classAbility'}>
												<AbilityNode item={displayedBuild.classAbility} active onClick={() => setSelectedItem(displayedBuild.classAbility)} />
											</EquipDropZone>
										</div>

										{/* Jump */}

										<div className='flex flex-col items-center gap-5'>
											<div className='text-xs uppercase tracking-[0.25em] text-white/40'>Movement</div>

											<EquipDropZone id={'movement'}>
												<AbilityNode item={displayedBuild.movement} active onClick={() => setSelectedItem(displayedBuild.movement)} />
											</EquipDropZone>
										</div>

										{/* Grenade */}

										<div className='flex flex-col items-center gap-5'>
											<div className='text-xs uppercase tracking-[0.25em] text-white/40'>Grenade</div>

											<EquipDropZone id='grenade'>
												<AbilityNode item={displayedBuild.grenade} active onClick={() => setSelectedItem(displayedBuild.grenade)} />
											</EquipDropZone>
										</div>

										{/* Melee */}

										<div className='flex flex-col items-center gap-5'>
											<div className='text-xs uppercase tracking-[0.25em] text-white/40'>Melee</div>

											<EquipDropZone id={'melee'}>
												<AbilityNode item={displayedBuild.melee} active onClick={() => setSelectedItem(displayedBuild.melee)} />
											</EquipDropZone>
										</div>
									</div>
								</div>

								{/* AVAILABLE ABILITIES */}

								<div>
									<div className='text-xl uppercase tracking-wide border-b border-white/20 pb-2 mb-10'>Available</div>

									<div className='grid grid-cols-4 gap-10'>
										{/* Class */}

										<div className='flex flex-wrap justify-center gap-5'>
											{abilities.classAbilities
												.filter((x: any) => x.hash !== displayedBuild.classAbility?.hash)
												.map((item: any) => (
													<AbilityNode key={item.hash} item={item} onClick={() => setSelectedItem(item)} />
												))}
										</div>

										{/* Movement */}

										<div className='flex flex-wrap justify-center gap-5'>
											{abilities.movements
												.filter((x: any) => x.hash !== displayedBuild.movement?.hash)
												.map((item: any) => (
													<AbilityNode key={item.hash} item={item} onClick={() => setSelectedItem(item)} />
												))}
										</div>

										{/* Grenades */}

										<div className='flex flex-wrap justify-center gap-5'>
											{abilities.grenades
												.filter((x: any) => x.hash !== displayedBuild.grenade?.hash)
												.map((item: any) => (
													<AbilityNode key={item.hash} item={item} onClick={() => setSelectedItem(item)} />
												))}
										</div>

										{/* Melees */}

										<div className='flex flex-wrap justify-center gap-5'>
											{abilities.melees
												.filter((x: any) => x.hash !== displayedBuild.melee?.hash)
												.map((item: any) => (
													<AbilityNode key={item.hash} item={item} onClick={() => setSelectedItem(item)} />
												))}
										</div>
									</div>
								</div>

								{/* LOWER SECTION */}

								<div className='grid grid-cols-2 gap-20'>
									{/* Fragments */}

									<div>
										<div className='text-xl uppercase tracking-wide border-b border-white/20 pb-2 mb-8'>Fragments</div>

										{/* Equipped */}

										<div className='flex flex-wrap gap-6 mb-10'>
											{displayedBuild.fragments?.map((item: any) => (
												<EquipDropZone key={item.hash} id={'fragment'}>
													<AbilityNode item={item} active onClick={() => setSelectedItem(item)} />
												</EquipDropZone>
											))}
										</div>

										{/* Available */}

										<div className='flex flex-wrap gap-5'>
											{fragments
												.filter((item: any) => !displayedBuild.fragments?.some((x: any) => x.hash === item.hash))
												.map((item: any) => (
													<AbilityNode key={item.hash} item={item} onClick={() => setSelectedItem(item)} />
												))}
										</div>
									</div>

									{/* Aspects */}

									<div>
										<div className='text-xl uppercase tracking-wide border-b border-white/20 pb-2 mb-8'>Aspects</div>

										{/* Equipped */}

										<div className='flex flex-wrap gap-6 mb-10'>
											{displayedBuild.aspects?.map((item: any) => (
												<EquipDropZone key={item.hash} id={'aspect'}>
													<AbilityNode item={item} active onClick={() => setSelectedItem(item)} />
												</EquipDropZone>
											))}
										</div>

										{/* Available */}

										<div className='flex flex-wrap gap-5'>
											{aspects
												.filter((item: any) => !displayedBuild.aspects?.some((x: any) => x.hash === item.hash))
												.map((item: any) => (
													<AbilityNode key={item.hash} item={item} onClick={() => setSelectedItem(item)} />
												))}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</motion.div>

				<DragOverlay>
					{dragging && (
						<div className='w-28 h-28 rotate-45 pointer-events-none'>
							<img src={`https://www.bungie.net${dragging.icon}`} className='w-full h-full object-contain -rotate-45 drop-shadow-[0_0_30px_rgba(255,255,255,0.45)]' />
						</div>
					)}
				</DragOverlay>
			</DndContext>

			{/* Modal */}

			<AnimatePresence>
				{selectedItem && (
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
						className='fixed inset-0 z-[99999] bg-black/70 backdrop-blur-xl'>
						<motion.div
							initial={{
								y: 30,
								opacity: 0,
							}}
							animate={{
								y: 0,
								opacity: 1,
							}}
							exit={{
								y: 30,
								opacity: 0,
							}}
							className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] rounded-[2rem] border border-white/10 bg-[#11151b]/95 overflow-hidden'>
							<div className='p-8'>
								<div className='flex items-start justify-between gap-6'>
									<div className='flex gap-5'>
										<div className='w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-white/5'>
											<img src={`https://www.bungie.net${selectedItem.icon}`} className='w-full h-full object-cover' />
										</div>

										<div>
											<div className='text-3xl font-black'>{selectedItem.name}</div>

											<div className='text-white/50 mt-2 uppercase text-sm tracking-wide'>{selectedItem.type}</div>
										</div>
									</div>

									<button onClick={() => setSelectedItem(null)} className='w-12 h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition flex items-center justify-center'>
										<X className='w-5 h-5' />
									</button>
								</div>

								<div className='mt-8 rounded-2xl border border-white/10 bg-black/30 p-5 text-white/70 leading-relaxed'>
									Humanity invented seven layers of Destiny manifest definitions so one grenade could have lore tabs.
								</div>

								<div className='mt-6 flex justify-end'>
									<button
										onClick={() => handleEquip(selectedItem)}
										className='px-5 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition flex items-center gap-3 text-sm font-semibold'>
										<Info className='w-4 h-4' />
										Equip
									</button>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { useMemo, useState } from 'react';

import { CSS } from '@dnd-kit/utilities';
import SubclassTree from './SubclassTree';
import { useCharacter } from '@/app/components/CharacterProvider';
import { useSession } from 'next-auth/react';

type Props = {
	subclasses: any[];

	activeSubclass: any;

	builds: Record<string, any>;

	onEquip?: (subclass: any) => Promise<void> | void;
};

function DraggableSubclass({ subclass, position, onClick }: { subclass: any; position: string; onClick: () => void }) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: subclass.itemHash,
		data: subclass,
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
				scale: 1.08,
				y: -2,
			}}
			whileTap={{
				scale: 0.96,
			}}
			onClick={onClick}
			className={`absolute ${position} z-10 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-0' : ''}`}
			{...listeners}
			{...attributes}>
			<div className='relative w-[72px] h-[72px] rotate-45 overflow-hidden'>
				<div className='absolute inset-0 -rotate-45 flex items-center justify-center'>
					<img
						draggable={false}
						src={`https://www.bungie.net${subclass.displayProperties.icon}`}
						className='w-full h-full object-contain opacity-80 hover:opacity-100 transition duration-200 drop-shadow-[0_0_14px_rgba(255,255,255,0.08)]'
					/>
				</div>
			</div>
		</motion.button>
	);
}

function EquippedDropZone({ activeSubclass, onClick, isDragging }: { activeSubclass: any; onClick: () => void; isDragging: boolean }) {
	const { setNodeRef, isOver } = useDroppable({
		id: 'equipped-subclass',
	});

	return (
		<motion.button
			ref={setNodeRef}
			layout
			whileHover={{
				scale: 1.03,
			}}
			whileTap={{
				scale: 0.97,
			}}
			onClick={onClick}
			className='relative z-20'>
			<div
				className={`
					relative w-[128px] h-[128px] rotate-45 overflow-hidden transition-all duration-200
					${isDragging ? 'scale-105' : ''}
					${isOver ? 'brightness-125 drop-shadow-[0_0_40px_rgba(255,255,255,0.45)]' : ''}
				`}>
				<div className='absolute inset-0 -rotate-45 flex items-center justify-center'>
					<img draggable={false} src={`https://www.bungie.net${activeSubclass.displayProperties.icon}`} className='w-full h-full object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.25)]' />
				</div>
			</div>

			<div className='absolute inset-0 blur-3xl bg-white/[0.03] scale-125 -z-10' />
		</motion.button>
	);
}

export default function SubclassPanel({ subclasses, activeSubclass, builds, onEquip }: Props) {
	const { data: session }: any = useSession();
	const { activeCharacterId } = useCharacter();

	const [selected, setSelected] = useState<any>(null);

	const [dragging, setDragging] = useState<any>(null);

	const [optimisticSubclass, setOptimisticSubclass] = useState<any>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 4,
			},
		})
	);

	const displayedActiveSubclass = optimisticSubclass || activeSubclass;

	const inactiveSubclasses = useMemo(() => {
		return subclasses.filter((x) => x.itemHash !== displayedActiveSubclass?.itemHash);
	}, [subclasses, displayedActiveSubclass]);

	const positions = [
		'top-0 left-1/2 -translate-x-1/2',
		'left-0 top-1/2 -translate-y-1/2',
		'right-0 top-1/2 -translate-y-1/2',
		'bottom-0 left-1/2 -translate-x-1/2',

		'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-90 opacity-75',
	];

	async function handleEquip(subclass: any) {
		if (!onEquip) return;

		const previous = displayedActiveSubclass;

		// instant optimistic render
		setOptimisticSubclass(subclass);

		try {
			await onEquip(subclass);

			// success → keep optimistic state
		} catch (err) {
			console.error(err);

			// rollback
			setOptimisticSubclass(previous);
		}
	}

	return (
		<>
			<DndContext
				sensors={sensors}
				onDragStart={({ active }) => {
					setDragging(active.data.current);
				}}
				onDragEnd={async ({ active, over }) => {
					if (over?.id === 'equipped-subclass') {
						await handleEquip(active.data.current);
					}

					setDragging(null);
				}}
				onDragCancel={() => {
					setDragging(null);
				}}>
				<div className='flex flex-col items-center gap-4'>
					<div className='ml-8  relative flex items-center gap-12 w-[410px] h-[260px]'>
						{/* LEFT */}

						<div className='relative w-[210px] h-[210px]'>
							<div className='absolute left-1/2 top-[28px] w-[1px] h-[42px] bg-white/10 -translate-x-1/2' />

							<div className='absolute left-[28px] top-1/2 w-[42px] h-[1px] bg-white/10 -translate-y-1/2' />

							<div className='absolute right-[28px] top-1/2 w-[42px] h-[1px] bg-white/10 -translate-y-1/2' />

							<div className='absolute left-1/2 bottom-[28px] w-[1px] h-[42px] bg-white/10 -translate-x-1/2' />

							{inactiveSubclasses.map((subclass, index) => (
								<DraggableSubclass key={subclass.itemHash} subclass={subclass} position={positions[index]} onClick={() => setSelected(subclass)} />
							))}
						</div>

						{/* RIGHT */}

						<div className='relative flex items-center'>
							<div className='absolute right-full top-1/2 w-16 h-[1px] bg-white/10 -translate-y-1/2' />

							{displayedActiveSubclass && <EquippedDropZone activeSubclass={displayedActiveSubclass} isDragging={!!dragging} onClick={() => setSelected(displayedActiveSubclass)} />}
						</div>
					</div>
				</div>

				<DragOverlay>
					{dragging && (
						<div className='w-[90px] h-[90px] rotate-45 pointer-events-none'>
							<div className='absolute inset-0 -rotate-45 flex items-center justify-center'>
								<img src={`https://www.bungie.net${dragging.displayProperties.icon}`} className='w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.45)]' />
							</div>
						</div>
					)}
				</DragOverlay>
			</DndContext>

			{/* FULLSCREEN */}

			<AnimatePresence>
				{selected && (
					<SubclassTree
						subclass={selected}
						build={builds[selected.itemHash]}
						activeBuild={builds[displayedActiveSubclass?.itemHash]}
						onClose={() => setSelected(null)}
						onEquipItem={async (item: any, socketIndex: any) => {
							const response = await fetch('/api/Destiny2/equip/socket', {
								method: 'POST',

								headers: {
									'Content-Type': 'application/json',
								},

								body: JSON.stringify({
									itemInstanceId: selected.itemInstanceId,

									socketIndex,

									plugHash: item.hash,

									characterId: activeCharacterId,

									membershipType: session.membershipType,
								}),
							});

							const data = await response.json();

							if (!response.ok || !data.ok) {
								throw new Error(data.error || 'Failed to equip socket');
							}
						}}
					/>
				)}
			</AnimatePresence>
		</>
	);
}

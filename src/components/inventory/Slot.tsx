/** @format */

'use client';

import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { memo, useMemo, useState } from 'react';

import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

type Props = {
	label: string;

	slotKey: string;

	items: any[];

	reverse?: boolean;

	onEquip?: (item: any) => Promise<void>;

	openVault: string | null;

	setOpenVault: React.Dispatch<React.SetStateAction<string | null>>;

	vaultLoading: boolean;
};

function DraggableItem({ item, rarityClass, size = 'small' }: { item: any; rarityClass: string; size?: 'small' | 'large' }) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: item.itemInstanceId ?? item.itemHash,
		data: item,
	});

	const style = {
		transform: CSS.Translate.toString(transform),
	};

	return (
		<motion.div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			whileHover={{
				scale: 1.04,
				y: -2,
			}}
			whileTap={{
				scale: 0.96,
			}}
			className={`
				relative overflow-hidden border transition cursor-grab active:cursor-grabbing
				${size === 'large' ? 'w-20 h-20 rounded-2xl' : 'w-16 h-16 rounded-xl'}
				${isDragging ? 'opacity-0' : ''}
				${rarityClass}
			`}>
			<img draggable={false} src={`https://www.bungie.net${item.displayProperties.icon}`} className='w-full h-full object-cover pointer-events-none' />
		</motion.div>
	);
}

function EquippedDropZone({ children }: { children: React.ReactNode }) {
	const { setNodeRef, isOver } = useDroppable({
		id: 'equip-slot',
	});

	return (
		<div
			ref={setNodeRef}
			className={`
				transition-all duration-200
				${isOver ? 'scale-105 brightness-125' : ''}
			`}>
			{children}
		</div>
	);
}

function Slot({
	label,
	slotKey,
	items,
	reverse = false,

	onEquip,

	openVault,
	setOpenVault,

	vaultLoading,
}: Props) {
	const [dragging, setDragging] = useState<any>(null);
	const [optimisticEquipped, setOptimisticEquipped] = useState<any>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 4,
			},
		})
	);

	const realEquipped = useMemo(() => items.find((i) => i.equipped), [items]);

	const equipped = optimisticEquipped || realEquipped;

	const inventory = useMemo(() => items.filter((i) => i.location === 1 && !i.equipped), [items]);

	const vault = useMemo(() => items.filter((i) => i.location === 2), [items]);

	const toggleVault = () => {
		setOpenVault((p) => (p === slotKey ? null : slotKey));
	};

	const rarityStyles: Record<string, string> = {
		Exotic: 'border-yellow-400/60 bg-yellow-500/10',
		Legendary: 'border-purple-400/50 bg-purple-500/10',
		Rare: 'border-blue-400/50 bg-blue-500/10',
		Common: 'border-gray-400/30 bg-white/5',
	};

	async function handleEquip(item: any) {
		if (!onEquip) return;

		const previous = realEquipped;

		setOptimisticEquipped(item);

		try {
			await onEquip(item);
		} catch (err) {
			console.error(err);

			setOptimisticEquipped(previous);
		}
	}

	return (
		<DndContext
			sensors={sensors}
			onDragStart={({ active }) => {
				setDragging(active.data.current);
			}}
			onDragEnd={async ({ active, over }) => {
				if (over?.id === 'equip-slot') {
					await handleEquip(active.data.current);
				}

				setDragging(null);
			}}
			onDragCancel={() => {
				setDragging(null);
			}}>
			<div className='relative'>
				<div className={`flex items-center justify-between mb-3 ${reverse ? 'flex-row-reverse' : ''}`}>
					<div className='text-[10px] uppercase tracking-[0.25em] text-white/40'>{label}</div>

					<button onClick={toggleVault} className='text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition'>
						Vault
					</button>
				</div>

				<div className={`flex gap-4 items-start ${reverse ? 'flex-row-reverse' : ''}`}>
					{/* Equipped */}

					<div className='shrink-0'>
						<EquippedDropZone>
							<div
								className={`relative w-20 h-20 rounded-2xl overflow-hidden border backdrop-blur-xl transition-all duration-200 ${rarityStyles[equipped?.inventory?.tierTypeName] || 'border-white/10 bg-white/5'}`}>
								{equipped?.displayProperties?.icon ? (
									<img draggable={false} src={`https://www.bungie.net${equipped.displayProperties.icon}`} className='w-full h-full object-cover pointer-events-none' />
								) : (
									<div className='w-full h-full bg-white/5' />
								)}

								<div className='absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur-sm px-2 py-1'>
									<div className='text-[10px] font-semibold truncate'>{equipped?.displayProperties?.name || 'Empty'}</div>
								</div>
							</div>
						</EquippedDropZone>
					</div>

					{/* Inventory */}

					<div className='grid grid-cols-3 gap-2'>
						{Array.from({ length: 9 }).map((_, i) => {
							const item = inventory[i];

							if (!item) {
								return <div key={i} className='w-16 h-16 rounded-xl border border-white/10 bg-black/30' />;
							}

							return <DraggableItem key={item.itemInstanceId ?? item.itemHash} item={item} rarityClass={rarityStyles[item?.inventory?.tierTypeName] || 'border-white/10 bg-black/30'} />;
						})}
					</div>
				</div>

				{/* Vault Drawer */}

				{openVault === slotKey && (
					<>
						<div className='fixed inset-0 bg-black/70 backdrop-blur-sm z-40' onClick={() => setOpenVault(null)} />

						<div
							className={`fixed top-6 bottom-6 z-50 rounded-[2rem] border border-white/10 bg-[#0f1115]/95 backdrop-blur-2xl p-6 overflow-hidden ${reverse ? 'right-6' : 'left-6'}`}
							style={{
								width: 'calc(100vw - 380px)',
							}}>
							<div className='flex items-center justify-between mb-6'>
								<div>
									<div className='text-[10px] uppercase tracking-[0.3em] text-white/40'>{label}</div>

									<h2 className='text-3xl font-black mt-1'>Vault</h2>
								</div>

								<button onClick={() => setOpenVault(null)} className='w-10 h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition'>
									✕
								</button>
							</div>

							{vaultLoading ? (
								<div className='opacity-70'>Loading...</div>
							) : (
								<div className='grid grid-cols-8 gap-3 overflow-y-auto h-[calc(100%-90px)] pr-2'>
									{vault.map((item) => (
										<div key={item.itemInstanceId ?? item.itemHash} className='group relative'>
											<DraggableItem item={item} size='large' rarityClass={rarityStyles[item.inventory?.tierTypeName] || 'border-white/10 bg-black/30'} />

											<div className='absolute inset-x-0 bottom-0 bg-black/80 p-2 opacity-0 group-hover:opacity-100 transition pointer-events-none'>
												<div className='text-[11px] font-semibold leading-tight'>{item.displayProperties.name}</div>

												<div className='text-[10px] text-white/50 mt-1'>{item.itemTypeDisplayName}</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</>
				)}

				<DragOverlay>
					{dragging && (
						<div className='w-24 h-24 rounded-2xl overflow-hidden border border-white/20 pointer-events-none'>
							<img src={`https://www.bungie.net${dragging.displayProperties.icon}`} className='w-full h-full object-cover' />
						</div>
					)}
				</DragOverlay>
			</div>
		</DndContext>
	);
}

export default memo(Slot);

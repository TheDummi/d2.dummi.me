/** @format */

'use client';

import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { memo, useEffect, useMemo, useState } from 'react';

import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

type Props = {
	label: string;

	slotKey: string;

	items: any[];

	reverse?: boolean;

	onEquip?: (item: any) => Promise<void>;

	onTransfer?: (item: any, toVault: boolean) => Promise<void>;

	onManualPull?: () => void;

	openVault: string | null;

	setOpenVault: React.Dispatch<React.SetStateAction<string | null>>;

	vaultLoading: boolean;
	freeSlots: number;

	setFreeSlots: (value: number) => void;
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
	onTransfer,
	onManualPull,

	openVault,
	setOpenVault,

	vaultLoading,

	freeSlots,
	setFreeSlots,
}: Props) {
	const [dragging, setDragging] = useState<any>(null);
	const [optimisticEquipped, setOptimisticEquipped] = useState<any>(null);
	const [optimisticItems, setOptimisticItems] = useState<any[] | null>(null);

	useEffect(() => {
		setOptimisticItems(null);
		setOptimisticEquipped(null);
	}, [items]);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 4,
			},
		})
	);

	const realEquipped = useMemo(() => items.find((i) => i.equipped), [items]);

	const equipped = optimisticEquipped || realEquipped;

	const displayedItems = optimisticItems || items;

	const inventory = useMemo(() => displayedItems.filter((i) => i.location === 1 && !i.equipped), [displayedItems]);

	const vault = useMemo(() => displayedItems.filter((i) => i.location === 2), [displayedItems]);

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

	async function handleTransfer(item: any, toVault: boolean) {
		if (!onTransfer) return;

		if (!toVault) {
			onManualPull?.();
		}

		const previous = displayedItems;

		const next = displayedItems.map((x) => {
			if (x.itemInstanceId !== item.itemInstanceId) {
				return x;
			}

			return {
				...x,
				location: toVault ? 2 : 1,
				equipped: false,
			};
		});

		setOptimisticItems(next);

		try {
			await onTransfer(item, toVault);
		} catch (err) {
			console.error(err);

			setOptimisticItems(previous);
		}
	}

	function InventoryDropZone({ children }: { children: React.ReactNode }) {
		const { setNodeRef, isOver } = useDroppable({
			id: 'inventory-slot',
		});

		return (
			<div
				ref={setNodeRef}
				className={`
				transition-all duration-200 rounded-2xl
				${isOver ? 'scale-[1.02] brightness-125' : ''}
			`}>
				{children}
			</div>
		);
	}

	function VaultDropZone({ children }: { children: React.ReactNode }) {
		const { setNodeRef, isOver } = useDroppable({
			id: 'vault-slot',
		});

		return (
			<div
				ref={setNodeRef}
				className={`
				h-full transition-all duration-200 rounded-3xl
				${isOver ? 'brightness-125 scale-[1.01]' : ''}
			`}>
				{children}
			</div>
		);
	}

	return (
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

				try {
					// equip
					if (over.id === 'equip-slot') {
						await handleEquip(item);
					}

					// move to vault
					else if (over.id === 'vault-slot') {
						if (item?.location !== 2) {
							await handleTransfer(item, true);
						}
					}

					// move from vault → inventory
					else if (over.id === 'inventory-slot') {
						if (item?.location === 2) {
							await handleTransfer(item, false);
						}
					}
				} catch (err) {
					console.error(err);
				}

				setDragging(null);
			}}
			onDragCancel={() => {
				setDragging(null);
			}}>
			<div className='relative'>
				<div
					className={`
		flex items-center justify-between mb-4
		${reverse ? 'flex-row-reverse' : ''}
	`}>
					<div className='flex flex-col'>
						<div className='text-sm font-semibold text-white/85 mt-1'>{label}</div>
					</div>

					<div className={`flex items-center gap-2 ${reverse ? 'flex-row-reverse' : ''}`}>
						<div className='flex items-center gap-2 px-2 py-1 rounded-xl border border-white/10 bg-white/[0.03]'>
							<div className='text-[9px] uppercase tracking-[0.2em] text-white/35 whitespace-nowrap'>Free</div>

							<input
								type='number'
								min={0}
								max={9}
								value={freeSlots}
								onChange={(e) => {
									const value = Number(e.target.value);

									setFreeSlots(Math.max(0, Math.min(9, value || 0)));
								}}
								className='
					w-10 h-7 rounded-lg
					bg-black/30 border border-white/10
					text-center text-xs font-semibold text-white
					outline-none
					focus:border-white/25
					transition
				'
							/>
						</div>

						<button
							onClick={toggleVault}
							className='
				h-9 px-4 rounded-xl
				border border-white/10
				bg-white/[0.03]
				text-[10px] uppercase tracking-[0.2em]
				text-white/50
				hover:text-white
				hover:bg-white/[0.06]
				transition
			'>
							Vault
						</button>
					</div>
				</div>

				<div className={`flex gap-4 items-start ${reverse ? 'flex-row-reverse' : ''}`}>
					{/* Equipped */}

					<div className='shrink-0'>
						<EquippedDropZone>
							<DraggableItem item={equipped} size='large' rarityClass={rarityStyles[equipped?.inventory?.tierTypeName] || 'border-white/10 bg-white/5'} />
						</EquippedDropZone>
					</div>

					{/* Inventory */}

					<InventoryDropZone>
						<div className='grid grid-cols-3 gap-2'>
							{Array.from({ length: 9 }).map((_, i) => {
								const item = inventory[i];

								if (!item) {
									return <div key={i} className='w-16 h-16 rounded-xl border border-white/10 bg-black/30' />;
								}

								return <DraggableItem key={item.itemInstanceId ?? item.itemHash} item={item} rarityClass={rarityStyles[item?.inventory?.tierTypeName] || 'border-white/10 bg-black/30'} />;
							})}
						</div>
					</InventoryDropZone>
				</div>

				{/* Vault Drawer */}

				{openVault === slotKey && (
					<>
						<div onClick={() => setOpenVault(null)} className='fixed inset-0 z-40 bg-black/30 pointer-events-none' />

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
								<VaultDropZone>
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
								</VaultDropZone>
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

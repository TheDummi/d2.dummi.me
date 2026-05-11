/** @format */

'use client';

import { signIn, useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import CharacterPreview from '@/components/inventory/CharacterPreview';
import CharacterStats from '@/components/inventory/CharacterStats';
import Slot from '@/components/inventory/Slot';
import SubclassPanel from '@/components/inventory/SubclassPanel';
import Toolbar from '@/components/inventory/Toolbar';
import { useCharacter } from '@/app/components/CharacterProvider';
import { useToast } from '../providers/ToastProvider';

export default function Page() {
	const { data: session } = useSession() as any;
	const { activeCharacterId } = useCharacter();
	const { toast } = useToast();

	if (!session) return signIn();

	const [loading, setLoading] = useState(true);

	const [manifest, setManifest] = useState<any>({});

	const [farmingEnabled, setFarmingEnabled] = useState(false);
	const [transferringItems, setTransferringItems] = useState<Set<string>>(new Set());
	const [lastManualPull, setLastManualPull] = useState<number>(0);

	const [slots, setSlots] = useState<Record<string, any[]>>({
		kinetic: [],
		energy: [],
		power: [],

		helmet: [],
		gauntlets: [],
		chest: [],
		legs: [],
		classItem: [],

		subclass: [],
	});

	const [slotFreeSpace, setSlotFreeSpace] = useState<Record<string, number>>({
		kinetic: 3,
		energy: 3,
		power: 3,

		helmet: 3,
		gauntlets: 3,
		chest: 3,
		legs: 3,
		classItem: 3,
	});

	const [openVault, setOpenVault] = useState<string | null>(null);
	const [vaultLoading, setVaultLoading] = useState(false);

	const [plugSets, setPlugSets] = useState<any>({});
	const [socketTypes, setSocketTypes] = useState<any>({});

	enum ItemSlot {
		Kinetic = 1498876634,
		Energy = 2465295065,
		Power = 953998645,

		Helmet = 3448274439,
		Gauntlets = 3551918588,
		ChestArmor = 14239492,
		LegArmor = 20886954,
		ClassItem = 1585787867,

		Subclass = 3284755031,
	}

	const slotMap: Record<string, number> = {
		kinetic: ItemSlot.Kinetic,
		energy: ItemSlot.Energy,
		power: ItemSlot.Power,

		helmet: ItemSlot.Helmet,
		gauntlets: ItemSlot.Gauntlets,
		chest: ItemSlot.ChestArmor,
		legs: ItemSlot.LegArmor,
		classItem: ItemSlot.ClassItem,

		subclass: ItemSlot.Subclass,
	};

	/* -------------------- LOAD INVENTORY -------------------- */

	const loadInventory = useCallback(async () => {
		if (!session || !activeCharacterId) return;

		if (!Object.keys(manifest).length) {
			setLoading(true);
		}

		try {
			const [inventoryManifest, plugSetManifest, socketTypeManifest] = await Promise.all([
				fetch('/api/Manifest/jsonWorldComponentContentPaths/en/DestinyInventoryItemDefinition').then((r) => r.json()),

				fetch('/api/Manifest/jsonWorldComponentContentPaths/en/DestinyPlugSetDefinition').then((r) => r.json()),

				fetch('/api/Manifest/jsonWorldComponentContentPaths/en/DestinySocketTypeDefinition').then((r) => r.json()),
			]);

			setManifest(inventoryManifest);
			setPlugSets(plugSetManifest);
			setSocketTypes(socketTypeManifest);

			const nextSlots: Record<string, any[]> = {
				kinetic: [],
				energy: [],
				power: [],

				helmet: [],
				gauntlets: [],
				chest: [],
				legs: [],
				classItem: [],

				subclass: [],
			};

			const inventoryItems = [...session.profileInventory.data.items, ...session.characterInventories.data[activeCharacterId].items];

			/* -------------------- INVENTORY + VAULT -------------------- */

			for (const item of inventoryItems) {
				const def = inventoryManifest[item.itemHash];

				if (!def?.equippingBlock) continue;

				const slotKey = Object.keys(slotMap).find((k) => slotMap[k] === def.equippingBlock.equipmentSlotTypeHash);

				if (!slotKey) continue;

				nextSlots[slotKey].push({
					...item,
					...def,
					equipped: false,
				});
			}

			/* -------------------- EQUIPPED -------------------- */

			for (const item of session.characterEquipment.data[activeCharacterId].items) {
				const def = inventoryManifest[item.itemHash];

				if (!def?.equippingBlock) continue;

				const slotKey = Object.keys(slotMap).find((k) => slotMap[k] === def.equippingBlock.equipmentSlotTypeHash);

				if (!slotKey) continue;

				// remove duplicate if exists

				nextSlots[slotKey] = nextSlots[slotKey].filter((x) => x.itemInstanceId !== item.itemInstanceId);

				nextSlots[slotKey].unshift({
					...item,
					...def,
					equipped: true,
				});
			}

			setSlots(nextSlots);
		} finally {
			setLoading(false);
		}
	}, [session, activeCharacterId]);

	useEffect(() => {
		loadInventory();
	}, [loadInventory]);

	/* -------------------- EQUIP ITEM -------------------- */

	async function equipItem(item: any) {
		const previousSlots = structuredClone(slots);

		const id = item.itemInstanceId;

		try {
			if (transferringItems.has(id)) {
				return;
			}

			setTransferringItems((prev) => new Set(prev).add(id));

			if (item.location === 2) {
				await transferItem(item, false);
			}

			toast(`Equipping ${item.displayProperties.name}`, 'info');

			const response = await fetch('/api/Destiny2/equip', {
				method: 'POST',

				headers: {
					'Content-Type': 'application/json',
				},

				body: JSON.stringify({
					itemId: item.itemInstanceId,

					membershipType: session.membershipType,

					characterId: activeCharacterId,
				}),
			});

			if (!response.ok) {
				toast(`Failed to equip ${item.displayProperties.name}`, 'error');

				return;
			}

			toast(`Equipped ${item.displayProperties.name}`, 'success');

			// optimistic update ONLY for the slot this item belongs to

			const slotKey = Object.keys(slotMap).find((k) => slotMap[k] === item.equippingBlock?.equipmentSlotTypeHash);

			if (!slotKey) return;

			// optimistic slot update

			const slotHash = item.equippingBlock?.equipmentSlotTypeHash;

			setSlots((prev) => {
				const next = structuredClone(prev);

				for (const key of Object.keys(next)) {
					next[key] = next[key].map((x: any) => {
						if (x.equippingBlock?.equipmentSlotTypeHash !== slotHash) {
							return x;
						}

						// newly equipped
						if (x.itemInstanceId === item.itemInstanceId) {
							return {
								...x,
								equipped: true,
								location: 0,
							};
						}

						// previously equipped
						if (x.equipped) {
							return {
								...x,
								equipped: false,
								location: 1,
							};
						}

						return x;
					});
				}

				return next;
			});
		} catch (err) {
			console.error(err);

			setSlots(previousSlots);

			toast(`Failed to equip ${item.displayProperties.name}`, 'error');
		} finally {
			setTimeout(() => {
				setTransferringItems((prev) => {
					const next = new Set(prev);

					next.delete(id);

					return next;
				});
			}, 1500);
		}
	}

	/* -------------------- TRANSFER ITEM -------------------- */

	async function transferItem(item: any, toVault: boolean) {
		try {
			toast(`Transferring ${item.displayProperties.name}`, 'info');

			const previousSlots = structuredClone(slots);

			// optimistic update

			setSlots((prev) => {
				const next = structuredClone(prev);

				for (const key of Object.keys(next)) {
					next[key] = next[key].map((x: any) => {
						if (x.itemInstanceId !== item.itemInstanceId) {
							return x;
						}

						return {
							...x,

							location: toVault ? 2 : 1,

							equipped: false,
						};
					});
				}

				return next;
			});

			const response = await fetch('/api/Destiny2/transfer', {
				method: 'POST',

				headers: {
					'Content-Type': 'application/json',
				},

				body: JSON.stringify({
					itemReferenceHash: item.itemHash,

					stackSize: 1,

					transferToVault: toVault,

					itemId: item.itemInstanceId,

					characterId: activeCharacterId,

					membershipType: session.membershipType,

					accessToken: session.accessToken,
				}),
			});

			if (response.ok) toast(`Transfered ${item.displayProperties.name}`, 'success');

			if (!response.ok) {
				toast(`Failed to transfer ${item.displayProperties.name}`, 'error');

				setSlots(previousSlots);

				throw new Error('Failed to transfer item');
			}
		} catch (err) {
			console.error(err);
		}
	}

	/* -------------------- HELPERS -------------------- */

	const getSlot = (slot: string) => slots[slot] || [];

	const character = session.characters.data[activeCharacterId ?? session.character.characterId];

	const subclass = useMemo(() => {
		return getSlot('subclass').find((x: any) => x.equipped);
	}, [slots]);

	const subclassBuilds = useMemo(() => {
		const subclasses = getSlot('subclass');

		const builds: Record<string, any> = {};

		for (const subclass of subclasses) {
			const socketData = session.itemComponents?.sockets?.data?.[subclass.itemInstanceId];

			/* -------------------- AVAILABLE PLUGS -------------------- */

			const socketEntries = subclass.sockets?.socketEntries || [];

			const allPlugs: any[] = [];

			for (const entry of socketEntries) {
				const reusablePlugSetHash = entry.reusablePlugSetHash || socketTypes?.[entry.socketTypeHash]?.reusablePlugSetHash;

				if (!reusablePlugSetHash) continue;

				const plugSet = plugSets?.[reusablePlugSetHash];

				if (!plugSet?.reusablePlugItems) continue;

				for (const plug of plugSet.reusablePlugItems) {
					const def = manifest[plug.plugItemHash];

					if (!def) continue;

					allPlugs.push({
						hash: plug.plugItemHash,

						name: def.displayProperties?.name,

						icon: def.displayProperties?.icon,

						description: def.displayProperties?.description,

						type: def.itemTypeDisplayName,

						itemCategoryHashes: def.itemCategoryHashes || [],
					});
				}
			}

			/* -------------------- EQUIPPED PLUGS -------------------- */

			const equippedPlugs =
				socketData?.sockets
					?.map((socket: any) => {
						if (!socket?.plugHash) return null;

						const def = manifest[socket.plugHash];

						if (!def) return null;

						return {
							hash: socket.plugHash,

							name: def.displayProperties?.name,

							icon: def.displayProperties?.icon,

							description: def.displayProperties?.description,

							type: def.itemTypeDisplayName,

							itemCategoryHashes: def.itemCategoryHashes || [],
						};
					})
					.filter(Boolean) || [];

			/* -------------------- UNIQUE -------------------- */

			const unique = (items: any[]) => {
				const map = new Map();

				for (const item of items) {
					map.set(item.hash, item);
				}

				return [...map.values()];
			};

			/* -------------------- FILTER HELPERS -------------------- */

			const byType = (items: any[], matcher: (x: any) => boolean) => unique(items.filter(matcher));

			/* -------------------- AVAILABLE -------------------- */

			const available = {
				supers: byType(allPlugs, (x) => x.type?.includes('Super')),

				grenades: byType(allPlugs, (x) => x.type?.includes('Grenade')),

				melees: byType(allPlugs, (x) => x.type?.includes('Melee')),

				classAbilities: byType(allPlugs, (x) => x.type?.includes('Class Ability')),

				movements: byType(allPlugs, (x) => x.type?.includes('Movement')),

				aspects: byType(allPlugs, (x) => x.type?.toLowerCase().includes('aspect')),

				fragments: byType(allPlugs, (x) => x.type?.toLowerCase().includes('fragment')),
			};

			/* -------------------- EQUIPPED -------------------- */

			const equipped = {
				super: equippedPlugs.find((x: any) => x.type?.includes('Super')),

				grenade: equippedPlugs.find((x: any) => x.type?.includes('Grenade')),

				melee: equippedPlugs.find((x: any) => x.type?.includes('Melee')),

				classAbility: equippedPlugs.find((x: any) => x.type?.includes('Class Ability')),

				movement: equippedPlugs.find((x: any) => x.type?.includes('Movement')),

				aspects: equippedPlugs.filter((x: any) => x.type?.toLowerCase().includes('aspect')),

				fragments: equippedPlugs.filter((x: any) => x.type?.toLowerCase().includes('fragment')),
			};

			builds[subclass.itemHash] = {
				equipped,
				available,
			};
		}

		return builds;
	}, [slots, manifest, session]);

	const [farmingBusy, setFarmingBusy] = useState(false);

	useEffect(() => {
		if (!farmingEnabled || farmingBusy) return;

		const now = Date.now();

		if (now - lastManualPull < 5000) {
			return;
		}

		for (const slotKey of Object.keys(slotFreeSpace)) {
			const reserve = slotFreeSpace[slotKey] - 1;

			const slotItems = getSlot(slotKey);

			const inventoryItems = slotItems.filter((x: any) => x.location === 1 && !x.equipped);

			const free = 9 - inventoryItems.length;

			if (free <= reserve) {
				const itemToVault = inventoryItems[0];

				if (!itemToVault) continue;

				setFarmingBusy(true);

				transferItem(itemToVault, true).finally(() => {
					setTimeout(() => {
						setFarmingBusy(false);
					}, 1000);
				});

				break;
			}
		}
	}, [slots, farmingEnabled, slotFreeSpace, farmingBusy]);

	/* -------------------- LOADING -------------------- */

	if (loading) {
		return (
			<div className='w-full h-screen grid place-items-center bg-[#0b0d10] text-white'>
				<div className='text-white/60 animate-pulse'>Loading Guardian...</div>
			</div>
		);
	}

	return (
		<div className={`min-h-screen overflow-hidden bg-[#0a0c10] text-white`}>
			{/* Background */}

			<div className='fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_40%)] pointer-events-none' />

			<Toolbar farmingEnabled={farmingEnabled} setFarmingEnabled={setFarmingEnabled} />

			<div className='relative grid grid-cols-[320px_1fr_320px] gap-12 px-10 py-10 min-h-screen'>
				{/* LEFT SIDE */}

				<div className='flex flex-col gap-6 z-10'>
					<SubclassPanel subclasses={getSlot('subclass')} activeSubclass={subclass} builds={subclassBuilds} onEquip={equipItem} />

					<Slot
						label='Kinetic'
						slotKey='kinetic'
						items={getSlot('kinetic')}
						reverse
						openVault={openVault}
						setOpenVault={setOpenVault}
						vaultLoading={vaultLoading}
						onEquip={equipItem}
						onTransfer={transferItem}
						freeSlots={slotFreeSpace.kinetic}
						onManualPull={() => {
							setLastManualPull(Date.now());
						}}
						setFreeSlots={(value) =>
							setSlotFreeSpace((prev) => ({
								...prev,
								kinetic: value,
							}))
						}
					/>

					<Slot
						label='Energy'
						slotKey='energy'
						items={getSlot('energy')}
						reverse
						openVault={openVault}
						setOpenVault={setOpenVault}
						vaultLoading={vaultLoading}
						onEquip={equipItem}
						onTransfer={transferItem}
						freeSlots={slotFreeSpace.energy}
						onManualPull={() => {
							setLastManualPull(Date.now());
						}}
						setFreeSlots={(value) =>
							setSlotFreeSpace((prev) => ({
								...prev,
								energy: value,
							}))
						}
					/>

					<Slot
						label='Power'
						slotKey='power'
						items={getSlot('power')}
						reverse
						openVault={openVault}
						setOpenVault={setOpenVault}
						vaultLoading={vaultLoading}
						onEquip={equipItem}
						onTransfer={transferItem}
						freeSlots={slotFreeSpace.power}
						onManualPull={() => {
							setLastManualPull(Date.now());
						}}
						setFreeSlots={(value) =>
							setSlotFreeSpace((prev) => ({
								...prev,
								power: value,
							}))
						}
					/>
				</div>

				{/* CENTER */}

				<div className='relative flex items-center justify-center'>
					<div className='relative'>
						<CharacterPreview character={character} emblem={character?.emblemBackgroundPath} />
					</div>
				</div>

				{/* RIGHT SIDE */}

				<div className='flex items-start justify-end gap-8'>
					{/* Stats */}

					<div className='sticky top-10 shrink-0'>
						<CharacterStats character={character} />
					</div>

					{/* Armor */}

					<div className='flex flex-col gap-6 shrink-0'>
						<Slot
							label='Helmet'
							slotKey='helmet'
							items={getSlot('helmet')}
							openVault={openVault}
							setOpenVault={setOpenVault}
							vaultLoading={vaultLoading}
							onEquip={equipItem}
							onTransfer={transferItem}
							freeSlots={slotFreeSpace.helmet}
							onManualPull={() => {
								setLastManualPull(Date.now());
							}}
							setFreeSlots={(value) =>
								setSlotFreeSpace((prev) => ({
									...prev,
									helmet: value,
								}))
							}
						/>

						<Slot
							label='Gauntlets'
							slotKey='gauntlets'
							items={getSlot('gauntlets')}
							openVault={openVault}
							setOpenVault={setOpenVault}
							vaultLoading={vaultLoading}
							onEquip={equipItem}
							onTransfer={transferItem}
							freeSlots={slotFreeSpace.gauntlets}
							onManualPull={() => {
								setLastManualPull(Date.now());
							}}
							setFreeSlots={(value) =>
								setSlotFreeSpace((prev) => ({
									...prev,
									gauntlets: value,
								}))
							}
						/>

						<Slot
							label='Chest'
							slotKey='chest'
							items={getSlot('chest')}
							openVault={openVault}
							setOpenVault={setOpenVault}
							vaultLoading={vaultLoading}
							onEquip={equipItem}
							onTransfer={transferItem}
							freeSlots={slotFreeSpace.chest}
							onManualPull={() => {
								setLastManualPull(Date.now());
							}}
							setFreeSlots={(value) =>
								setSlotFreeSpace((prev) => ({
									...prev,
									chest: value,
								}))
							}
						/>

						<Slot
							label='Legs'
							slotKey='legs'
							items={getSlot('legs')}
							openVault={openVault}
							setOpenVault={setOpenVault}
							vaultLoading={vaultLoading}
							onEquip={equipItem}
							onTransfer={transferItem}
							freeSlots={slotFreeSpace.legs}
							onManualPull={() => {
								setLastManualPull(Date.now());
							}}
							setFreeSlots={(value) =>
								setSlotFreeSpace((prev) => ({
									...prev,
									legs: value,
								}))
							}
						/>

						<Slot
							label='Class Item'
							slotKey='classItem'
							items={getSlot('classItem')}
							openVault={openVault}
							setOpenVault={setOpenVault}
							vaultLoading={vaultLoading}
							onEquip={equipItem}
							onTransfer={transferItem}
							freeSlots={slotFreeSpace.classItem}
							onManualPull={() => {
								setLastManualPull(Date.now());
							}}
							setFreeSlots={(value) =>
								setSlotFreeSpace((prev) => ({
									...prev,
									classItem: value,
								}))
							}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

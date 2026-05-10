/** @format */

'use client';

import { signIn, useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import CharacterPreview from '@/components/inventory/CharacterPreview';
import CharacterStats from '@/components/inventory/CharacterStats';
import Slot from '@/components/inventory/Slot';
import SubclassPanel from '@/components/inventory/SubclassPanel';
import { useCharacter } from '@/app/components/CharacterProvider';
import { useToast } from '../providers/ToastProvider';

export default function Page() {
	const { data: session } = useSession() as any;
	const { activeCharacterId } = useCharacter();
	const { toast } = useToast();

	if (!session) return signIn();

	const [loading, setLoading] = useState(true);

	const [manifest, setManifest] = useState<any>({});

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

	const [openVault, setOpenVault] = useState<string | null>(null);
	const [vaultLoading, setVaultLoading] = useState(false);
	const [equippingItem, setEquippingItem] = useState<string | null>(null);

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

		try {
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
						// same slot → unequip current
						if (x.equippingBlock?.equipmentSlotTypeHash === slotHash) {
							return {
								...x,
								equipped: x.itemInstanceId === item.itemInstanceId,
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

			{/* Equip Overlay */}

			{equippingItem && (
				<div className='fixed inset-0 z-[200] pointer-events-none'>
					<div className='absolute top-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-2xl text-sm font-semibold'>Equipping Item...</div>
				</div>
			)}

			<div className='relative grid grid-cols-[320px_1fr_320px] gap-12 px-10 py-10 min-h-screen'>
				{/* LEFT SIDE */}

				<div className='flex flex-col gap-6 z-10'>
					<SubclassPanel subclasses={getSlot('subclass')} activeSubclass={subclass} builds={subclassBuilds} onEquip={equipItem} />

					<Slot label='Kinetic' slotKey='kinetic' items={getSlot('kinetic')} reverse openVault={openVault} setOpenVault={setOpenVault} vaultLoading={vaultLoading} onEquip={equipItem} />

					<Slot label='Energy' slotKey='energy' items={getSlot('energy')} reverse openVault={openVault} setOpenVault={setOpenVault} vaultLoading={vaultLoading} onEquip={equipItem} />

					<Slot label='Power' slotKey='power' items={getSlot('power')} reverse openVault={openVault} setOpenVault={setOpenVault} vaultLoading={vaultLoading} onEquip={equipItem} />
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
						<Slot label='Helmet' slotKey='helmet' items={getSlot('helmet')} openVault={openVault} setOpenVault={setOpenVault} vaultLoading={vaultLoading} onEquip={equipItem} />

						<Slot label='Gauntlets' slotKey='gauntlets' items={getSlot('gauntlets')} openVault={openVault} setOpenVault={setOpenVault} vaultLoading={vaultLoading} onEquip={equipItem} />

						<Slot label='Chest' slotKey='chest' items={getSlot('chest')} openVault={openVault} setOpenVault={setOpenVault} vaultLoading={vaultLoading} onEquip={equipItem} />

						<Slot label='Legs' slotKey='legs' items={getSlot('legs')} openVault={openVault} setOpenVault={setOpenVault} vaultLoading={vaultLoading} onEquip={equipItem} />

						<Slot label='Class Item' slotKey='classItem' items={getSlot('classItem')} openVault={openVault} setOpenVault={setOpenVault} vaultLoading={vaultLoading} onEquip={equipItem} />
					</div>
				</div>
			</div>
		</div>
	);
}

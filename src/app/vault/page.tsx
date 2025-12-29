/** @format */

'use client';

import { signIn, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { useCharacter } from '@/app/components/CharacterProvider';

export default function Page() {
	const { data: session } = useSession() as any;

	if (!session) return signIn();

	const { activeCharacterId } = useCharacter();
	const [loading, setLoading] = useState(true);
	const [openVault, setOpenVault] = useState<string | null>(null);
	const [vaultLoading, setVaultLoading] = useState(false);

	const [slots, setSlots] = useState<Record<string, any[]>>({
		kinetic: [],
		energy: [],
		power: [],
		helmet: [],
		gauntlets: [],
		chest: [],
		legs: [],
		classItem: [],
	});

	enum ItemType {
		Armor = 2,
		Weapon = 3,
	}

	enum ItemSlot {
		Kinetic = 1498876634,
		Energy = 2465295065,
		Power = 953998645,
		Helmet = 3448274439,
		Gauntlets = 3551918588,
		ChestArmor = 14239492,
		LegArmor = 20886954,
		ClassItem = 1585787867,
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
	};

	/* -------------------- LOAD & MERGE INVENTORY -------------------- */
	useEffect(() => {
		if (!session || !activeCharacterId) return;

		(async () => {
			setLoading(true);

			const manifest = await fetch(`/api/Manifest/jsonWorldComponentContentPaths/en/DestinyInventoryItemDefinition`).then((r) => r.json());

			const nextSlots: Record<string, any[]> = {
				kinetic: [],
				energy: [],
				power: [],
				helmet: [],
				gauntlets: [],
				chest: [],
				legs: [],
				classItem: [],
			};

			// Character inventory + vault
			const inventoryItems = [...session.profileInventory.data.items, ...session.characterInventories.data[activeCharacterId].items];

			for (const item of inventoryItems) {
				const def = manifest[item.itemHash];
				if (!def?.equippingBlock) continue;

				const slotKey = Object.keys(slotMap).find((k) => slotMap[k] === def.equippingBlock.equipmentSlotTypeHash);

				if (!slotKey) continue;

				nextSlots[slotKey].push({
					...item,
					...def,
					equipped: false,
				});
			}

			// Equipped items (authoritative)
			for (const item of session.characterEquipment.data[activeCharacterId].items) {
				const def = manifest[item.itemHash];

				console.log(def);
				if (!def?.equippingBlock) continue;

				const slotKey = Object.keys(slotMap).find((k) => slotMap[k] === def.equippingBlock.equipmentSlotTypeHash);

				if (!slotKey) continue;

				nextSlots[slotKey].push({
					...item,
					...def,
					equipped: true,
				});
			}

			setSlots(nextSlots);
			setLoading(false);
		})();
	}, [session, activeCharacterId]);

	const character = session.characters.data[activeCharacterId ?? session.character.characterId];

	const toggleVault = (slot: string) => {
		setOpenVault((p) => (p === slot ? null : slot));
		setVaultLoading(true);
		setTimeout(() => setVaultLoading(false), 200);
	};

	/* -------------------- SLOT COMPONENT -------------------- */
	const Slot = ({ label, slotKey, reverse = false }: any) => {
		const items = slots[slotKey] ?? [];

		const equipped = items.find((i) => i.equipped);
		const inventory = items.filter((i) => i.location === 1 && !i.equipped);
		const vault = items.filter((i) => i.location === 2);

		return (
			<div className='relative'>
				<div className='text-xs opacity-60 mb-2'>{label}</div>

				<div className={`flex gap-3 ${reverse ? 'flex-row-reverse' : ''}`}>
					<div>
						<div className='w-16 h-16 bg-black/40 border border-white/30'>
							{equipped?.displayProperties?.icon && <img src={`https://www.bungie.net${equipped.displayProperties.icon}`} className='w-full h-full object-cover' />}
						</div>
						<button onClick={() => toggleVault(slotKey)} className='mt-1 text-[10px] uppercase opacity-70 hover:opacity-100'>
							Vault
						</button>
					</div>

					<div className='grid grid-cols-3 gap-1'>
						{Array.from({ length: 9 }).map((_, i) => {
							const item = inventory[i];
							return (
								<div key={i} className='w-14 h-14 bg-black/30 border border-white/10'>
									{item?.displayProperties?.icon && <img src={`https://www.bungie.net${item.displayProperties.icon}`} className='w-full h-full object-cover' />}
								</div>
							);
						})}
					</div>
				</div>

				{openVault === slotKey && (
					<>
						<div className='fixed inset-0 z-30' onClick={() => setOpenVault(null)} />
						<div className={`fixed top-20 bottom-2 z-40 bg-[#12151a] border border-white/10 rounded-2xl p-6 ${reverse ? 'right-2' : 'left-2'}`} style={{ width: 'calc(100vw - 340px)' }}>
							<div className='text-xs uppercase opacity-60 mb-4'>{label} Vault</div>

							{vaultLoading ? (
								<div className='opacity-70'>Loading…</div>
							) : (
								<div className='grid grid-cols-18 gap-3 overflow-x-auto'>
									{vault.map((item) => (
										<div key={item.itemInstanceId ?? item.itemHash} className='w-16 h-16 bg-black/40 border border-white/10'>
											<img src={`https://www.bungie.net${item.displayProperties.icon}`} className='w-full h-full object-cover' />
										</div>
									))}
								</div>
							)}
						</div>
					</>
				)}
			</div>
		);
	};

	if (loading) {
		return <div className='w-full h-screen grid place-items-center bg-[#1a1d22] text-white'>Loading Manifest…</div>;
	}

	return (
		<div className='w-full bg-linear-to-br from-[#2c3138] to-[#1a1d22] text-white'>
			<h1>
				<center>Page is a work in progress and is far from functional!</center>
			</h1>
			<div className='grid grid-cols-[260px_1fr_420px] px-12 py-8 gap-10'>
				<div className='flex flex-col gap-6'>
					<>subclass</>
					<Slot label='Kinetic' slotKey='kinetic' reverse />
					<Slot label='Energy' slotKey='energy' reverse />
					<Slot label='Power' slotKey='power' reverse />
					<>ghost</>
				</div>

				<div className='flex items-center justify-center'>
					<div className='w-[360px] h-[640px] bg-white/5 border border-white/10' />
				</div>

				<div className='grid grid-cols-[160px_1fr] gap-6'>
					<div className='border border-white/10 bg-black/30 p-4 h-fit'>
						<div className='text-xs opacity-60'>Power</div>
						<div className='text-4xl font-semibold mb-4'>{character.light}</div>

						<div className='grid grid-cols-2 gap-y-1 text-[10px] opacity-80'>
							<div>Health</div>
							<div className='text-right'>{character.stats[392767087]}</div>
							<div>Melee</div>
							<div className='text-right'>{character.stats[4244567218]}</div>
							<div>Grenade</div>
							<div className='text-right'>{character.stats[1735777505]}</div>
							<div>Class</div>
							<div className='text-right'>{character.stats[144602215]}</div>
							<div>Super</div>
							<div className='text-right'>{character.stats[1943323491]}</div>
							<div>Weapons</div>
							<div className='text-right'>{character.stats[2996146975]}</div>
						</div>
					</div>

					<div className='flex flex-col gap-6'>
						<Slot label='Helmet' slotKey='helmet' />
						<Slot label='Gauntlets' slotKey='gauntlets' />
						<Slot label='Chest' slotKey='chest' />
						<Slot label='Legs' slotKey='legs' />
						<Slot label='Class Item' slotKey='classItem' />
					</div>
				</div>
			</div>
		</div>
	);
}

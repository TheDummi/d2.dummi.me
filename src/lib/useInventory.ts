/** @format */

'use client';

import { useEffect, useMemo, useState } from 'react';

const SLOT_HASHES = {
	kinetic: 1498876634,
	energy: 2465295065,
	power: 953998645,

	helmet: 3448274439,
	gauntlets: 3551918588,
	chest: 14239492,
	legs: 20886954,
	classItem: 1585787867,

	subclass: 3284755031,
};

export default function useInventory({
	session,

	activeCharacterId,
}: {
	session: any;

	activeCharacterId: string | null;
}) {
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

	useEffect(() => {
		if (!session || !activeCharacterId) return;

		(async () => {
			try {
				setLoading(true);

				const definitions = await fetch('/api/Manifest/jsonWorldComponentContentPaths/en/DestinyInventoryItemDefinition').then((r) => r.json());

				setManifest(definitions);

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

				const inventoryItems = [...(session.profileInventory?.data?.items || []), ...(session.characterInventories?.data?.[activeCharacterId]?.items || [])];

				const equippedItems = session.characterEquipment?.data?.[activeCharacterId]?.items || [];

				/* -------------------- INVENTORY -------------------- */

				for (const item of inventoryItems) {
					const def = definitions[item.itemHash];

					if (!def?.equippingBlock) continue;

					const slotKey = Object.keys(SLOT_HASHES).find((key) => SLOT_HASHES[key as keyof typeof SLOT_HASHES] === def.equippingBlock.equipmentSlotTypeHash);

					if (!slotKey) continue;

					nextSlots[slotKey].push({
						...item,

						...def,

						equipped: false,
					});
				}

				/* -------------------- EQUIPPED -------------------- */

				for (const item of equippedItems) {
					const def = definitions[item.itemHash];

					if (!def?.equippingBlock) continue;

					const slotKey = Object.keys(SLOT_HASHES).find((key) => SLOT_HASHES[key as keyof typeof SLOT_HASHES] === def.equippingBlock.equipmentSlotTypeHash);

					if (!slotKey) continue;

					nextSlots[slotKey].push({
						...item,

						...def,

						equipped: true,
					});
				}

				setSlots(nextSlots);
			} catch (error) {
				console.error('Inventory load failed:', error);
			} finally {
				setLoading(false);
			}
		})();
	}, [session, activeCharacterId]);

	/* -------------------- HELPERS -------------------- */

	const getSlot = (slot: string) => {
		return slots[slot] || [];
	};

	const getEquipped = (slot: string) => {
		return slots[slot]?.find((item) => item.equipped);
	};

	const getInventory = (slot: string) => {
		return slots[slot]?.filter((item) => item.location === 1 && !item.equipped) || [];
	};

	const getVault = (slot: string) => {
		return slots[slot]?.filter((item) => item.location === 2) || [];
	};

	/* -------------------- SUBCLASS -------------------- */

	const subclass = useMemo(() => {
		return getEquipped('subclass');
	}, [slots]);

	return {
		loading,

		manifest,

		slots,

		subclass,

		getSlot,

		getEquipped,

		getInventory,

		getVault,
	};
}

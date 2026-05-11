/** @format */

export default {
	season: 'Archery',

	gameSettings: {
		type: 'Clash',
		time: '15min',
		score: { 3: '100', 4: '150' },
		resurrectuion: 'Disabled',
		respawn: '1s',
		overshield: 'Disabled',
		radar: 'Enabled',
		special: { option: 'Special Ammo Meter', cooldown: 'Disabled' },
		heavy: 'Disabled',
		grenade: 'Disabled',
		melee: 'Disabled',
		class: 'Disabled',
		super: 'Disabled',
		modifiers: 'None',
	},

	maxStats: {
		health: 100,
		weapons: 100,
	},

	bannedSubclasses: [],

	bannedWeapons: ['Wish-Ender', 'Wish-Keeper', 'Verglas Curve', 'Trinity Ghoul', 'Le Monarque', "Ticuu's Divination", 'Hierarchy of Needs'],

	bannedMods: {},

	bannedTypes: ['Sidearm', 'Trace Rifle', 'Grenade Launcher', 'Linear Fusion Rifle', 'Glaive', 'Fusion Rifle', 'Sword', 'Pulse Rifle', 'Scout Rifle', 'Hand Cannon', 'Shotgun', 'Sniper Rifle'],

	bannedExotics: {
		Titan: [],

		Hunter: [],

		Warlock: [],
	},

	bannedAspects: [],

	bannedFragments: [],

	bannedGrenades: [],

	bannedSupers: [],

	bannedMelees: [],
};

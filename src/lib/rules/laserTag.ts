/** @format */

export default {
	season: 'Laser Tag',

	gameSettings: {
		type: 'Clash',
		time: '15min',
		score: { 3: '100', 4: '150' },
		resurrectuion: 'Disabled',
		respawn: '1s',
		overshield: 'Enabled',
		radar: 'Enabled',
		special: { option: 'Respawn With Special Ammo', cooldown: 'Infinite' },
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

	bannedWeapons: [],

	bannedMods: {},

	bannedTypes: ['Sidearm', 'Combat Bow', 'Grenade Launcher', 'Linear Fusion Rifle', 'Glaive', 'Fusion Rifle', 'Sword', 'Pulse Rifle', 'Scout Rifle', 'Hand Cannon', 'Shotgun', 'Sniper Rifle'],

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

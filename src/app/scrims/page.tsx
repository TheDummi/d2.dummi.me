/** @format */
'use client';

import { Activity, AlertTriangle, ChevronDown, Eye, Shield, ShieldOff, Swords, Timer, Trophy, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { signIn, useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';

import { useFireteam } from '../components/FireteamProvider';

export default function Page() {
	const { data: session } = useSession() as any;

	if (!session) {
		signIn();
		return <div className='min-h-screen bg-black flex items-center justify-center text-white'>Authenticating...</div>;
	}

	const { fireteam, loading } = useFireteam();

	const [definitions, setDefinitions] = useState<any>({});

	const [manifestLoading, setManifestLoading] = useState(true);
	const [loadingMessage, setLoadingMessage] = useState('Loading Scrims...');

	const [rules, setRules] = useState<any>(null);
	const [rulesKey, setRulesKey] = useState<string>();
	const [rulesets, setRulesets] = useState<any>({});
	const [ruleSelector, setRuleSelector] = useState<Array<{ value: string; name: string }>>([]);

	const [selectedMap, setSelectedMap] = useState<any>(null);
	const [rollingMap, setRollingMap] = useState<any>(null);
	const [rolling, setRolling] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				const rulesets = await fetch('/api/rules').then((r) => r.json());

				const sets = Object.entries(rulesets).map(([key, value]: any) => ({ value: key, name: value.season }));

				setRulesets(rulesets);
				setRuleSelector(sets);

				const key = Object.keys(rulesets)[Object.keys(rulesets).length - 1];

				setRulesKey(key);

				setRules(rulesets[key]);

				const urls = [
					'DestinyInventoryItemDefinition',
					'DestinyStatDefinition',
					'DestinyDamageTypeDefinition',
					'DestinyInventoryBucketDefinition',
					'DestinySocketTypeDefinition',
					'DestinyPlugSetDefinition',
					'DestinySandboxPerkDefinition',
					'DestinyActivityDefinition',
				];

				const responses = await Promise.all(
					urls.map(async (name) => {
						setLoadingMessage(`Loading ${name}...`);

						const res = await fetch(`/api/Manifest/jsonWorldComponentContentPaths/en/${name}`);

						if (!res.ok) {
							throw new Error(`${name} failed: ${res.status}`);
						}

						const json = await res.json();

						return [name, json];
					})
				);

				const mapped = Object.fromEntries(responses);

				setDefinitions({
					items: mapped['DestinyInventoryItemDefinition'],

					stats: mapped['DestinyStatDefinition'],

					damage: mapped['DestinyDamageTypeDefinition'],

					buckets: mapped['DestinyInventoryBucketDefinition'],

					sockets: mapped['DestinySocketTypeDefinition'],

					plugs: mapped['DestinyPlugSetDefinition'],

					perks: mapped['DestinySandboxPerkDefinition'],

					activities: mapped['DestinyActivityDefinition'],
				});
			} catch (err) {
				console.error('Manifest load failed:', err);
			} finally {
				setManifestLoading(false);
			}
		})();
	}, []);

	const players = useMemo(() => {
		if (!definitions || !fireteam.length || !rules) return [];

		return fireteam.map((member: any) => {
			const parsed = parseGuardian(member, definitions);

			return {
				...parsed,
				violations: validatePlayer(parsed, Math.floor(fireteam.length / 2), rules),
			};
		});
	}, [fireteam, definitions, rules]);

	const { alpha, bravo, spectators } = useMemo(() => {
		return balanceTeams(players);
	}, [players]);

	const maps = useMemo(() => {
		if (!definitions.activities) return [];

		return Object.values(definitions.activities)
			.filter((activity: any) => {
				const { name, icon, hasIcon } = activity.displayProperties;

				if (!name || !hasIcon) return false;

				// remove junk
				if (
					name.includes('Quest') ||
					name.includes('Matchmade') ||
					name.includes('Story') ||
					name.includes('Strike') ||
					name.includes('Dungeon') ||
					name.includes('Raid') ||
					name.includes('Offensive') ||
					name.includes('Private') ||
					name.includes('Iron Banner') ||
					name.includes(':')
				) {
					return false;
				}

				// PvP only
				return activity.isPvP && !activity.isPlaylist;
			})
			.map((activity: any) => ({
				hash: activity.hash,
				name: activity.displayProperties.name,
				description: activity.displayProperties.description,
				image: activity.pgcrImage,
			}));
	}, [definitions]);

	useEffect(() => {
		if (!maps.length || selectedMap) return;

		setSelectedMap(maps[Math.floor(Math.random() * maps.length)]);
	}, [maps]);

	async function rerollMap() {
		if (!maps.length || rolling) return;

		setRolling(true);

		const duration = 2200;

		const start = Date.now();

		let delay = 60;

		let chosen = maps[Math.floor(Math.random() * maps.length)];

		while (Date.now() - start < duration) {
			const randomMap = maps[Math.floor(Math.random() * maps.length)];

			setRollingMap(randomMap);

			await new Promise((r) => setTimeout(r, delay));

			// progressively slow down
			delay += 18;

			chosen = randomMap;
		}

		setSelectedMap(chosen);
		setRollingMap(null);
		setRolling(false);
	}

	const displayMap = rollingMap || selectedMap;

	if (loading || manifestLoading || !rules) {
		return (
			<div className='min-h-screen text-white flex items-center justify-center'>
				<div className='text-white/60 animate-pulse'>{loadingMessage}</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen text-white'>
			<div className='max-w-7xl mx-auto px-6 py-10 '>
				<div className='flex items-center gap-4 mb-8'>
					<div className='p-4 rounded-3xl bg-white/5 border border-white/10'>
						<Swords className='w-8 h-8' />
					</div>

					<div className='w-full'>
						<div className='flex justify-between items-center gap-4 flex-wrap'>
							<h1 className='text-5xl font-black tracking-tight'>Scrims</h1>

							<div className='relative'>
								<select
									name=''
									id=''
									onChange={(e) => setRules(rulesets[e.target.value])}
									className='appearance-none rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl px-5 py-3 pr-12 text-sm font-medium text-white outline-none transition hover:border-white/20 focus:border-blue-400/40 focus:ring-2 focus:ring-blue-400/10'>
									{ruleSelector.map(({ value, name }) => (
										<option key={value} value={value} className='bg-[#090909] text-white' selected={rulesKey == value}>
											{name}
										</option>
									))}
								</select>

								<div className='pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/40'>
									<ChevronDown className='w-4 h-4' />
								</div>
							</div>
						</div>

						<p className='text-white/50'>Competitive Destiny. These are unofficial scrim rules, this is how we like to play. (if old user data loads like the wrong character, fly in to tower.)</p>
					</div>
				</div>

				<div className='relative mb-10 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] backdrop-blur-2xl'>
					{/* Background glow */}

					<div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-red-500/10 pointer-events-none' />

					<div className='relative grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-white/5'>
						<Info icon={<Users className='w-5 h-5' />} label='Match' value={`${alpha.length}v${bravo.length}`} accent='blue' />

						<Info icon={<Swords className='w-5 h-5' />} label='Mode' value='Clash' accent='red' />

						<Info icon={<ShieldOff className='w-5 h-5' />} label='Power Ammo' value='Disabled' accent='yellow' />

						<Info icon={<Timer className='w-5 h-5' />} label='Time' value='15 Minutes' accent='blue' />

						<Info icon={<Activity className='w-5 h-5' />} label='Respawn' value='7 Seconds' accent='red' />

						<Info icon={<Trophy className='w-5 h-5' />} label='Score' value={fireteam.length >= 8 ? '75' : '50'} accent='yellow' />
					</div>
				</div>

				<AnimatePresence mode='wait'>
					<motion.div
						key={selectedMap?.hash}
						initial={{
							opacity: 0,
							y: 40,
							scale: 1.03,
							filter: 'blur(14px)',
						}}
						animate={{
							opacity: 1,
							y: 0,
							scale: 1,
							filter: 'blur(0px)',
						}}
						exit={{
							opacity: 0,
							y: -40,
							scale: 0.98,
							filter: 'blur(10px)',
						}}
						transition={{
							duration: 0.45,
							ease: [0.22, 1, 0.36, 1],
						}}
						className='group relative mb-10 overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.04] backdrop-blur-2xl h-72 shadow-[0_0_80px_rgba(255,255,255,0.03)]'>
						{/* Background image */}

						<AnimatePresence mode='wait'>
							<motion.img
								key={displayMap?.hash}
								src={`https://bungie.net${displayMap?.image}`}
								alt={displayMap?.name}
								initial={{
									scale: 1.12,
									opacity: 0,
									filter: 'blur(12px)',
								}}
								animate={{
									scale: rolling ? 1.04 : 1,
									opacity: 1,
									filter: 'blur(0px)',
									x: rolling ? [0, -8, 8, -4, 0] : 0,
								}}
								exit={{
									scale: 0.94,
									opacity: 0,
									filter: 'blur(10px)',
								}}
								transition={{
									duration: rolling ? 0.16 : 0.55,
									ease: [0.22, 1, 0.36, 1],
								}}
								className='absolute inset-0 w-full h-full object-cover'
							/>
						</AnimatePresence>

						{/* Ambient glow */}

						<div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-red-500/10 pointer-events-none' />

						{/* Main overlays */}

						<div className='absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/10' />

						<div className='absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent' />

						{/* Vignette */}

						<div className='absolute inset-0 shadow-[inset_0_-120px_120px_rgba(0,0,0,0.95)] pointer-events-none' />

						{/* Noise texture */}

						<div className='absolute inset-0 opacity-[0.05] mix-blend-soft-light pointer-events-none bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[size:14px_14px]' />

						{/* Shine sweep */}

						<motion.div
							initial={{
								x: '-120%',
							}}
							animate={{
								x: '120%',
							}}
							transition={{
								duration: 0.9,
								ease: 'easeInOut',
							}}
							className='absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]'
						/>

						{/* Rolling scan effect */}

						{rolling && (
							<motion.div
								initial={{
									y: '-100%',
								}}
								animate={{
									y: '200%',
								}}
								transition={{
									duration: 0.45,
									repeat: Infinity,
									ease: 'linear',
								}}
								className='absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-cyan-300/10 to-transparent blur-xl pointer-events-none'
							/>
						)}

						{/* Content */}

						<div className='relative h-full p-7 flex flex-col justify-end'>
							<motion.div
								initial={{
									opacity: 0,
									y: 12,
								}}
								animate={{
									opacity: 1,
									y: 0,
								}}
								transition={{
									delay: 0.08,
								}}
								className='text-[10px] uppercase tracking-[0.35em] text-white/40 mb-2'>
								Selected Map
							</motion.div>

							<AnimatePresence mode='wait'>
								<motion.h2
									key={displayMap?.hash}
									initial={{
										y: 24,
										opacity: 0,
										filter: 'blur(8px)',
										scale: 0.96,
									}}
									animate={{
										y: 0,
										opacity: 1,
										filter: 'blur(0px)',
										scale: rolling ? 1.01 : 1,
									}}
									exit={{
										y: -24,
										opacity: 0,
										filter: 'blur(8px)',
										scale: 1.04,
									}}
									transition={{
										duration: rolling ? 0.1 : 0.38,
										ease: [0.22, 1, 0.36, 1],
									}}
									className='text-5xl md:text-6xl font-black tracking-[-0.04em] leading-none drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]'>
									{displayMap?.name || 'Loading...'}
								</motion.h2>
							</AnimatePresence>

							<motion.p
								initial={{
									opacity: 0,
									y: 18,
								}}
								animate={{
									opacity: 1,
									y: 0,
								}}
								transition={{
									delay: 0.18,
								}}
								className='text-sm text-white/50 mt-3 max-w-2xl line-clamp-2'>
								{displayMap?.description || 'Humanity continues resolving conflict through glowing rectangles.'}
							</motion.p>

							<motion.div
								initial={{
									opacity: 0,
									y: 18,
								}}
								animate={{
									opacity: 1,
									y: 0,
								}}
								transition={{
									delay: 0.24,
								}}
								className='mt-6 flex items-center gap-3'>
								<button
									onClick={rerollMap}
									disabled={rolling}
									className='group/button relative overflow-hidden px-5 py-3 rounded-2xl border border-white/10 bg-black/40 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 text-sm font-semibold backdrop-blur-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'>
									<div className='absolute inset-0 opacity-0 group-hover/button:opacity-100 transition bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/button:translate-x-[100%] duration-700' />

									<span className='relative z-10'>{rolling ? 'Rolling Maps...' : 'Reroll Map'}</span>
								</button>

								{rolling && <div className='text-xs uppercase tracking-[0.25em] text-cyan-300/70 animate-pulse'>Searching Arena...</div>}
							</motion.div>
						</div>
					</motion.div>
				</AnimatePresence>

				<div className='grid xl:grid-cols-2 gap-8'>
					<TeamCard title='Alpha Team' players={alpha} issues={validateTeam(alpha, rules)} rules={rules} />

					<TeamCard title='Bravo Team' players={bravo} issues={validateTeam(bravo, rules)} rules={rules} />
				</div>

				{!!spectators.length && (
					<div className='mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5'>
						<div className='flex items-center gap-3 mb-5'>
							<Eye className='w-5 h-5' />

							<h2 className='text-2xl font-black'>Spectators</h2>
						</div>

						<div className='grid gap-5'>
							{spectators.map((player: any) => (
								<PlayerCard key={player.characterId} player={player} rules={rules} />
							))}
						</div>
					</div>
				)}
				<BanList definitions={definitions} rules={rules} />
			</div>
		</div>
	);
}

const BUCKETS = {
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

const STATS = {
	health: 392767087,
	melee: 4244567218,
	grenade: 1735777505,
	super: 144602215,
	weapons: 2996146975,
	classAbility: 1943323491,
};

function resolveItem(hash: number, definitions: any) {
	const def = definitions.items?.[hash];

	return {
		hash,

		name: def?.displayProperties?.name || 'Unknown',

		icon: def?.displayProperties?.icon,

		type: def?.itemTypeDisplayName || 'Unknown',

		tier: def?.inventory?.tierTypeName || 'Unknown',

		isExotic: def?.inventory?.tierTypeName === 'Exotic',

		itemType: def?.itemType,

		classType: def?.classType,

		damageTypeHash: def?.defaultDamageTypeHash,

		sockets: def?.sockets?.socketEntries || [],
	};
}

function parseGuardian(member: any, definitions: any) {
	const profile = member.profile.profile.data.userInfo;

	const characters = member.profile.characters.data;

	const equipment = member.profile.characterEquipment.data;

	const parsedCharacters = Object.entries(equipment).map(([characterId, data]: any) => {
		const character = characters[characterId];

		const items = data.items.map((item: any) => ({
			...item,

			...resolveItem(item.itemHash, definitions),
		}));

		/* -------------------- WEAPONS -------------------- */

		const weapons = items
			.filter((x: any) => [BUCKETS.kinetic, BUCKETS.energy, BUCKETS.power].includes(x.bucketHash))
			.map((weapon: any) => {
				const socketData = member.profile.itemComponents?.sockets?.data?.[weapon.itemInstanceId];

				const plugs =
					socketData?.sockets
						?.map((socket: any) => {
							if (!socket.plugHash) return null;

							return resolveItem(socket.plugHash, definitions);
						})
						.filter(Boolean) || [];

				return {
					...weapon,

					plugs,
				};
			});

		/* -------------------- ARMOR -------------------- */

		const armor = items.filter((x: any) => [BUCKETS.helmet, BUCKETS.gauntlets, BUCKETS.chest, BUCKETS.legs, BUCKETS.classItem].includes(x.bucketHash));

		/* -------------------- SUBCLASS -------------------- */
		const subclassItem = items.find((item: any) => item.bucketHash === BUCKETS.subclass);

		const subclassDef = resolveItem(subclassItem?.itemHash, definitions);

		const subclass = {
			hash: subclassItem?.itemHash,

			name: subclassDef?.name || 'Unknown',

			icon: subclassDef?.icon,

			damageType: subclassDef?.name?.includes('Shadebinder')
				? 'Stasis'
				: subclassDef?.name?.includes('Revenant')
					? 'Stasis'
					: subclassDef?.name?.includes('Behemoth')
						? 'Stasis'
						: subclassDef?.name?.includes('Threadrunner')
							? 'Strand'
							: subclassDef?.name?.includes('Berserker')
								? 'Strand'
								: subclassDef?.name?.includes('Broodweaver')
									? 'Strand'
									: subclassDef?.name?.includes('Prismatic')
										? 'Prismatic'
										: 'Light',
		};

		const socketData = member.profile.itemComponents?.sockets?.data?.[subclassItem?.itemInstanceId];

		const equippedPlugs =
			socketData?.sockets
				?.map((socket: any) => {
					if (!socket.plugHash) return null;

					return resolveItem(socket.plugHash, definitions);
				})
				.filter(Boolean) || [];

		const subclassBuild = extractSubclassBuild(equippedPlugs);

		/* -------------------- EXOTIC ARMOR -------------------- */

		const exoticArmor = armor.find((x: any) => x.isExotic);

		/* -------------------- RETURN -------------------- */

		return {
			characterId,

			name: `${profile.bungieGlobalDisplayName}#${profile.bungieGlobalDisplayNameCode}`,

			class: character.classType === 0 ? 'Titan' : character.classType === 1 ? 'Hunter' : 'Warlock',

			emblem: `https://bungie.net/${character.emblemBackgroundPath}`,

			weapons,

			armor,

			subclass,

			subclassBuild,

			exoticArmor,

			stats: {
				health: character.stats[STATS.health] || 0,

				melee: character.stats[STATS.melee] || 0,

				grenade: character.stats[STATS.grenade] || 0,

				super: character.stats[STATS.super] || 0,

				weapons: character.stats[STATS.weapons] || 0,

				classAbility: character.stats[STATS.classAbility] || 0,
			},
		};
	});

	return parsedCharacters[0];
}

function validatePlayer(player: any, matchSize: number, rules: any) {
	const violations: string[] = [];

	// Stat limits

	if (player.stats.melee > rules.maxStats.melee) {
		violations.push(`Melee above ${rules.maxStats.melee}`);
	}

	if (player.stats.grenade > rules.maxStats.grenade) {
		violations.push(`Grenade above ${rules.maxStats.grenade}`);
	}

	if (player.stats.super > rules.maxStats.super) {
		violations.push(`Super above ${rules.maxStats.super}`);
	}

	if (player.stats.weapons > rules.maxStats.weapons) {
		violations.push(`Weapons above ${rules.maxStats.weapons}`);
	}

	// Exotic armor bans

	if (player.exoticArmor) {
		const banned = rules.bannedExotics?.[player.class as 'Warlock' | 'Hunter' | 'Titan'] || [];

		if (banned.includes(player.exoticArmor.name)) {
			violations.push(`${player.exoticArmor.name} banned`);
		}
	}

	// Subclass bans

	if (player.subclass?.damageType && rules.bannedSubclasses.includes(player.subclass.damageType)) {
		violations.push(`${player.subclass.damageType} subclass banned`);
	}

	// Weapon checks

	for (const weapon of player.weapons) {
		// Exact banned weapons

		if (rules.bannedWeapons.includes(weapon.name)) {
			violations.push(`${weapon.name} banned`);
		}

		// Archetype bans

		if (rules.bannedTypes.includes(weapon.type)) {
			violations.push(`${weapon.type} banned`);
		}

		// Snipers banned in 4s

		if (matchSize >= 4 && weapon.type === 'Sniper Rifle') {
			violations.push('Snipers banned in 4s');
		}

		// Exotic pulses/scouts

		if (weapon.isExotic && weapon.type === 'Pulse Rifle') {
			violations.push('Exotic Pulse banned');
		}

		if (weapon.isExotic && weapon.type === 'Scout Rifle') {
			violations.push('Exotic Scout banned');
		}

		const bannedForType = [...(rules.bannedMods.ALL || []), ...((rules.bannedMods as any)[weapon.type] || [])];

		for (const plug of weapon.plugs || []) {
			if (bannedForType.includes(plug.name)) {
				violations.push(`${plug.name} banned on ${weapon.type}`);
			}
		}
	}

	// Aspects

	for (const aspect of player.subclassBuild.aspects || []) {
		if (rules.bannedAspects.includes(aspect.name)) {
			violations.push(`${aspect.name} aspect banned`);
		}
	}

	// Abilities

	for (const ability of player.subclassBuild.abilities || []) {
		if (rules.bannedGrenades.includes(ability.name)) {
			violations.push(`${ability.name} grenade banned`);
		}

		if (rules.bannedSupers.includes(ability.name)) {
			violations.push(`${ability.name} super banned`);
		}

		if (rules.bannedMelees.includes(ability.name)) {
			violations.push(`${ability.name} melee banned`);
		}
	}

	// Fragment bans

	for (const fragment of player.subclassBuild.fragments || []) {
		if (rules.bannedFragments.includes(fragment.name)) {
			violations.push(`${fragment.name} fragment banned`);
		}
	}

	// Super bans

	if (player.subclassBuild?.super?.name && rules.bannedSupers.includes(player.subclassBuild.super.name)) {
		violations.push(`${player.subclassBuild.super.name} banned`);
	}

	return [...new Set(violations)];
}

function getPlayerScore(player: any) {
	let score = 0;

	// Base stat weight

	score += player.stats.health;
	score += player.stats.melee;
	score += player.stats.grenade;
	score += player.stats.super;
	score += player.stats.weapons;

	// Exotic armor value

	if (player.exoticArmor) {
		score += 15;
	}

	// Weapon weighting

	for (const weapon of player.weapons) {
		// Exotics slightly stronger

		if (weapon.isExotic) {
			score += 10;
		}

		// Special ammo weapons

		if (['Shotgun', 'Sniper Rifle', 'Fusion Rifle', 'Trace Rifle'].includes(weapon.type)) {
			score += 8;
		}

		// Meta-ish archetypes

		if (['Hand Cannon', 'Pulse Rifle'].includes(weapon.type)) {
			score += 5;
		}
	}

	// Violations lower score heavily

	score -= player.violations.length * 50;

	return score;
}

function canJoinTeam(player: any, team: any[]) {
	// Max 2 same class

	const sameClass = team.filter((x) => x.class === player.class).length;

	if (sameClass >= 2) {
		return false;
	}

	// Max 2 same subclass

	const sameSubclass = team.filter((x) => x.subclass?.name === player.subclass?.name).length;

	if (sameSubclass >= 2) {
		return false;
	}

	// Duplicate exotic restrictions

	if (player.exoticArmor?.name) {
		const sameExotic = team.filter((x) => x.exoticArmor?.name === player.exoticArmor?.name).length;

		if (['Dunemarchers', 'Ophidian Aspect'].includes(player.exoticArmor.name) && sameExotic >= 1) {
			return false;
		}
	}

	return true;
}

function getTeamScore(team: any[]) {
	return team.reduce((acc, player) => acc + getPlayerScore(player), 0);
}

function balanceTeams(players: any[]) {
	// Odd player out becomes spectator

	const spectators = players.length % 2 === 1 ? [players[players.length - 1]] : [];

	const active = spectators.length ? players.slice(0, -1) : players;

	// Sort strongest first

	const sorted = [...active].sort((a, b) => getPlayerScore(b) - getPlayerScore(a));

	const alpha: any[] = [];
	const bravo: any[] = [];

	for (const player of sorted) {
		const alphaScore = getTeamScore(alpha);

		const bravoScore = getTeamScore(bravo);

		const alphaCanTake = canJoinTeam(player, alpha);

		const bravoCanTake = canJoinTeam(player, bravo);

		// Prefer weaker team

		if (alphaScore <= bravoScore) {
			if (alphaCanTake) {
				alpha.push(player);
			} else if (bravoCanTake) {
				bravo.push(player);
			}
		} else {
			if (bravoCanTake) {
				bravo.push(player);
			} else if (alphaCanTake) {
				alpha.push(player);
			}
		}
	}

	return {
		alpha,
		bravo,
		spectators,
	};
}

function Info({ icon, label, value, accent = 'blue' }: { icon: React.ReactNode; label: string; value: string; accent?: 'blue' | 'red' | 'yellow' }) {
	const styles = {
		blue: {
			icon: 'text-blue-300',
			glow: 'from-blue-500/20',
		},

		red: {
			icon: 'text-red-300',
			glow: 'from-red-500/20',
		},

		yellow: {
			icon: 'text-yellow-300',
			glow: 'from-yellow-500/20',
		},
	};

	const style = styles[accent];

	return (
		<div className='relative p-5 overflow-hidden'>
			<div className={`absolute inset-0 opacity-50 bg-gradient-to-br ${style.glow} via-transparent to-transparent`} />

			<div className='relative'>
				<div className={`flex items-center gap-2 mb-3 ${style.icon}`}>
					{icon}

					<span className='text-xs uppercase tracking-[0.2em] font-semibold text-white/40'>{label}</span>
				</div>

				<div className='text-2xl font-black tracking-tight text-white'>{value}</div>
			</div>
		</div>
	);
}

function TeamCard({ title, players, issues, rules }: { title: string; players: any[]; issues: string[]; rules: any }) {
	const totalScore = players.reduce((acc, player) => acc + getPlayerScore(player), 0);

	const isAlpha = title.includes('Alpha');

	return (
		<div
			className={`relative rounded-3xl overflow-hidden backdrop-blur-xl border ${
				isAlpha ? 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.15)]' : 'bg-red-500/10 border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.15)]'
			}`}>
			<div
				className={`absolute inset-0 pointer-events-none ${
					isAlpha ? 'bg-gradient-to-br from-blue-500/20 via-transparent to-transparent' : 'bg-gradient-to-br from-red-500/20 via-transparent to-transparent'
				}`}
			/>

			<div className={`relative p-5 border-b ${isAlpha ? 'border-blue-500/20' : 'border-red-500/20'}`}>
				<div className='flex items-start justify-between gap-4'>
					<div>
						<h2 className={`text-2xl font-black ${isAlpha ? 'text-blue-300' : 'text-red-300'}`}>{title}</h2>

						<p className='text-sm text-white/50 mt-1'>
							Team Score: <span className='text-white font-semibold'>{totalScore}</span>
						</p>
					</div>

					<div className={`px-3 py-1 rounded-full text-xs border backdrop-blur-xl ${isAlpha ? 'bg-blue-500/10 border-blue-500/20 text-blue-200' : 'bg-red-500/10 border-red-500/20 text-red-200'}`}>
						{players.length} Players
					</div>
				</div>

				{!!issues.length && (
					<div className='flex flex-wrap gap-2 mt-4'>
						{issues.map((issue) => (
							<div key={issue} className='px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs'>
								{issue}
							</div>
						))}
					</div>
				)}
			</div>

			<div className='relative p-5 grid gap-5'>
				{players.map((player) => (
					<PlayerCard key={player.characterId} player={player} rules={rules} />
				))}
			</div>
		</div>
	);
}

function validateTeam(team: any[], rules: any) {
	const issues: string[] = [];

	const classes: Record<string, number> = {};

	const subclasses: Record<string, number> = {};

	const exotics: Record<string, number> = {};

	const weaponExotics: Record<string, number> = {};

	const grenades: Record<string, number> = {};

	for (const player of team) {
		// Class tracking

		classes[player.class] = (classes[player.class] || 0) + 1;

		// Subclass tracking

		if (player.subclass?.name) {
			subclasses[player.subclass.name] = (subclasses[player.subclass.name] || 0) + 1;
		}

		// Armor exotic tracking

		if (player.exoticArmor?.name) {
			exotics[player.exoticArmor.name] = (exotics[player.exoticArmor.name] || 0) + 1;
		}

		// Grenade tracking

		if (player.subclassBuild?.grenade?.name) {
			grenades[player.subclassBuild.grenade.name] = (grenades[player.subclassBuild.grenade.name] || 0) + 1;
		}

		// Exotic weapon tracking

		for (const weapon of player.weapons) {
			if (weapon.isExotic) {
				weaponExotics[weapon.name] = (weaponExotics[weapon.name] || 0) + 1;
			}
		}
	}

	// Max 2 same class

	Object.entries(classes).forEach(([name, count]) => {
		if (count > 2) {
			issues.push(`Too many ${name}s`);
		}
	});

	// No duplicate subclasses

	Object.entries(subclasses).forEach(([name, count]) => {
		if (count > 1) {
			issues.push(`Duplicate subclass: ${name}`);
		}
	});

	// Restricted duplicate exotics

	Object.entries(exotics).forEach(([name, count]) => {
		if (['Dunemarchers', 'Ophidian Aspect'].includes(name) && count > 1) {
			issues.push(`Duplicate exotic: ${name}`);
		}
	});

	// No duplicate grenades

	Object.entries(grenades).forEach(([name, count]) => {
		if (count > 1) {
			issues.push(`Duplicate grenade: ${name}`);
		}
	});

	return [...new Set(issues)];
}

function PlayerCard({ player, rules }: { player: any; rules: any }) {
	const [open, setOpen] = useState(false);

	return (
		<motion.div
			layout
			whileHover={{ y: -4 }}
			transition={{
				duration: 0.15,
			}}
			className='rounded-3xl overflow-hidden border border-white/10 bg-black/30 backdrop-blur-xl'>
			<button onClick={() => setOpen(!open)} className='relative h-36 w-full text-left group overflow-hidden'>
				<img src={player.emblem} alt='' className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105' />

				<div className='absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent' />

				<div className='absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors' />

				<div className='absolute bottom-4 left-4'>
					<h3 className='text-xl font-black'>{player.name}</h3>

					<p className='text-sm text-white/60'>{player.class}</p>
				</div>

				<div className='absolute top-3 right-3 flex items-center gap-2'>
					{!!player.violations?.length && (
						<div className='px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold backdrop-blur-xl'>
							{player.violations.length} Violation
							{player.violations.length !== 1 && 's'}
						</div>
					)}

					<div className='w-9 h-9 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl flex items-center justify-center'>
						<motion.div
							animate={{
								rotate: open ? 180 : 0,
							}}>
							<ChevronDown className='w-4 h-4 text-white/70' />
						</motion.div>
					</div>
				</div>
			</button>

			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						initial={{
							height: 0,
							opacity: 0,
						}}
						animate={{
							height: 'auto',
							opacity: 1,
						}}
						exit={{
							height: 0,
							opacity: 0,
						}}
						transition={{
							duration: 0.2,
						}}
						className='overflow-hidden'>
						<div className='p-4'>
							<div className='grid grid-cols-2 gap-3'>
								<Stat label='Health' value={player.stats.health} rules={rules} />

								<Stat label='Melee' value={player.stats.melee} red={player.stats.melee > rules.maxStats.melee} rules={rules} />

								<Stat label='Grenade' value={player.stats.grenade} red={player.stats.grenade > rules.maxStats.grenade} rules={rules} />

								<Stat label='Super' value={player.stats.super} red={player.stats.super > rules.maxStats.super} rules={rules} />

								<Stat label='Weapons' value={player.stats.weapons} red={player.stats.weapons > rules.maxStats.weapons} rules={rules} />

								<Stat label='Class' value={player.stats.classAbility} rules={rules} />
							</div>

							<div className='mt-5 grid gap-3 text-sm'>
								{/* Subclass */}

								<div className='rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden'>
									{/* Header */}

									<div className='p-4 border-b border-white/5'>
										<div className='text-[10px] uppercase tracking-[0.25em] text-white/35 mb-4'>Subclass</div>

										<div className='flex items-center gap-4'>
											<div className='relative w-16 h-16 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0'>
												{player.subclass?.icon ? (
													<img src={`https://bungie.net${player.subclass.icon}`} alt={player.subclass.name} className='w-full h-full object-cover' />
												) : (
													<div className='w-full h-full flex items-center justify-center text-xs text-white/30'>?</div>
												)}
											</div>

											<div className='min-w-0'>
												<div className='text-lg font-bold truncate'>{player.subclass?.name || 'Unknown'}</div>

												<div className='flex items-center gap-2 mt-1'>
													<div className='px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-white/50'>{player.subclass?.damageType}</div>
												</div>
											</div>
										</div>
									</div>

									{/* Build */}

									<div className='p-4'>
										<div className='flex items-center justify-between mb-3'>
											<div className='text-[10px] uppercase tracking-[0.25em] text-white/35'>Subclass Build</div>

											<div className='text-[10px] text-white/25'>
												{
													[
														player.subclassBuild.super,
														player.subclassBuild.grenade,
														player.subclassBuild.melee,
														player.subclassBuild.classAbility,
														...(player.subclassBuild.aspects || []),
														...(player.subclassBuild.fragments || []),
													].filter(Boolean).length
												}{' '}
												Equipped
											</div>
										</div>

										<div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
											{[
												player.subclassBuild.super,
												player.subclassBuild.grenade,
												player.subclassBuild.melee,
												player.subclassBuild.classAbility,
												...(player.subclassBuild.aspects || []),
												...(player.subclassBuild.fragments || []),
											]
												.filter(Boolean)
												.map((item: any) => (
													<div
														key={`${item.hash}-${item.name}`}
														className='group flex items-center gap-3 rounded-2xl bg-black/20 border border-white/5 p-2.5 hover:border-white/10 hover:bg-white/[0.03] transition-all'>
														<div className='relative w-11 h-11 rounded-xl overflow-hidden bg-white/5 shrink-0 border border-white/10'>
															{item.icon ? (
																<img src={`https://bungie.net${item.icon}`} alt={item.name} className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105' />
															) : (
																<div className='w-full h-full flex items-center justify-center text-[10px] text-white/30'>?</div>
															)}
														</div>

														<div className='min-w-0 flex-1'>
															<div className='text-sm font-semibold truncate'>{item.name}</div>

															<div className='text-[10px] uppercase tracking-wider text-white/35 truncate'>{item.type}</div>
														</div>
													</div>
												))}
										</div>
									</div>
								</div>

								{/* Exotic Armor */}

								{player.exoticArmor && (
									<div className='rounded-2xl bg-yellow-500/10 border border-yellow-500/20 p-3'>
										<div className='text-[10px] uppercase tracking-wider text-yellow-200/50 mb-3'>Exotic Armor</div>

										<div className='flex items-center gap-3'>
											<div className='w-14 h-14 rounded-xl overflow-hidden bg-black/20 border border-yellow-500/20 shrink-0'>
												{player.exoticArmor.icon ? (
													<img src={`https://bungie.net${player.exoticArmor.icon}`} alt={player.exoticArmor.name} className='w-full h-full object-cover' />
												) : (
													<div className='w-full h-full flex items-center justify-center text-[10px] text-white/30'>?</div>
												)}
											</div>

											<div>
												<div className='font-semibold text-yellow-300'>{player.exoticArmor.name}</div>

												<div className='text-xs text-yellow-200/50'>{player.exoticArmor.type}</div>
											</div>
										</div>
									</div>
								)}

								{/* Abilities / Aspects / Fragments */}
							</div>

							<div className='mt-5'>
								<div className='text-xs uppercase tracking-wider text-white/40 mb-3'>Loadout</div>

								<div className='grid gap-2'>
									{player.weapons.map((weapon: any) => (
										<div className='flex items-center justify-between gap-3'>
											<div className='flex items-center gap-3 min-w-0'>
												<div className='w-12 h-12 rounded-xl overflow-hidden bg-white/5 shrink-0 border border-white/10'>
													{weapon.icon ? (
														<img src={`https://bungie.net${weapon.icon}`} alt={weapon.name} className='w-full h-full object-cover' />
													) : (
														<div className='w-full h-full flex items-center justify-center text-[10px] text-white/30'>?</div>
													)}
												</div>

												<div className='min-w-0'>
													<div className='font-semibold truncate'>{weapon.name}</div>

													<div className='text-xs text-white/50'>{weapon.type}</div>
												</div>
											</div>

											{weapon.isExotic && <div className='text-[10px] uppercase tracking-wider text-yellow-300 shrink-0'>Exotic</div>}
										</div>
									))}
								</div>
							</div>

							{!!player.violations?.length && (
								<div className='mt-5'>
									<div className='flex items-center gap-2 text-red-300 mb-3'>
										<AlertTriangle className='w-4 h-4' />

										<span className='text-sm font-semibold'>Violations</span>
									</div>

									<div className='flex flex-wrap gap-2'>
										{player.violations.map((v: string) => (
											<div key={v} className='px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs'>
												{v}
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

function Stat({ label, value, red, rules }: { label: string; value: number; red?: boolean; rules: any }) {
	const statKeyMap = {
		Health: null,
		Class: null,
		Melee: 'melee',
		Grenade: 'grenade',
		Super: 'super',
		Weapons: 'weapons',
	};

	const statKey = statKeyMap[label as keyof typeof statKeyMap];

	const maxAllowed = statKey ? (rules.maxStats as any)[statKey as any] : 200;

	return (
		<div className='rounded-2xl bg-white/[0.04] border border-white/5 p-3'>
			<div className='text-[10px] uppercase tracking-wider text-white/40 mb-1'>{label}</div>

			<div className={`text-lg font-black transition-colors ${red ? 'text-red-400' : 'text-white'}`}>{value}</div>

			<div className='relative mt-2 h-1.5 rounded-full bg-white/5 overflow-visible'>
				{/* Max marker */}

				{statKey && (
					<>
						<div
							className='absolute top-1/2 -translate-y-1/2 z-10'
							style={{
								left: `${(maxAllowed / 200) * 100}%`,
							}}>
							<div className='w-[2px] h-4 bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)] rounded-full' />
						</div>

						<div
							className='absolute -top-5 text-[9px] text-red-300/80 font-semibold'
							style={{
								left: `${(maxAllowed / 200) * 100}%`,
								transform: 'translateX(-50%)',
							}}>
							{maxAllowed}
						</div>
					</>
				)}

				{/* Fill */}

				<div
					className={`h-full rounded-full transition-all ${red ? 'bg-red-400' : 'bg-white/70'}`}
					style={{
						width: `${Math.min((value / 200) * 100, 100)}%`,
					}}
				/>
			</div>
		</div>
	);
}

function extractSubclassBuild(plugs: any[]) {
	return {
		super: plugs.find((x: any) => x.type?.includes('Super')),

		melee: plugs.find((x: any) => x.type?.includes('Melee')),

		grenade: plugs.find((x: any) => x.type?.includes('Grenade')),

		classAbility: plugs.find((x: any) => x.type?.includes('Class Ability')),

		movement: plugs.find((x: any) => x.type?.includes('Movement')),

		aspects: plugs.filter((x: any) => x.type?.toLowerCase().includes('aspect')),

		fragments: plugs.filter((x: any) => x.type?.toLowerCase().includes('fragment')),

		all: plugs,
	};
}

function BanList({ definitions, rules }: { definitions: any; rules: any }) {
	const [open, setOpen] = useState(false);

	const [search, setSearch] = useState('');

	const bannedItems = [
		...rules.bannedWeapons.map((name: any) => ({
			type: 'Weapon',
			name,
		})),

		...Object.entries(rules.bannedExotics).flatMap(([cls, items]) =>
			(items as string[]).map((name) => ({
				type: `${cls} Exotic`,
				name,
			}))
		),

		...rules.bannedAspects.map((name: any) => ({
			type: 'Aspect',
			name,
		})),

		...rules.bannedFragments.map((name: any) => ({
			type: 'Fragment',
			name,
		})),

		...rules.bannedGrenades.map((name: any) => ({
			type: 'Grenade',
			name,
		})),

		...rules.bannedSupers.map((name: any) => ({
			type: 'Super',
			name,
		})),

		...rules.bannedMelees.filter(Boolean).map((name: any) => ({
			type: 'Melee',
			name,
		})),

		...Object.entries(rules.bannedMods).flatMap(([weaponType, mods]) =>
			(mods as string[]).map((name) => ({
				type: `${weaponType} Mod`,
				name,
			}))
		),
	];

	const resolved = useMemo(() => {
		const allDefs = Object.values(definitions.items || {}) as any[];

		const mapped = bannedItems.map((item) => {
			const def = allDefs.find((x: any) => {
				const nameMatch = x.displayProperties?.name === item.name;

				if (!nameMatch) return false;

				const itemType = x.itemTypeDisplayName || '';

				/* -------------------- WEAPONS -------------------- */

				if (item.type === 'Weapon') {
					return x.itemType === 3;
				}

				/* -------------------- EXOTICS -------------------- */

				if (item.type.includes('Exotic')) {
					return x.inventory?.tierTypeName === 'Exotic' && x.itemType !== 3 && x.itemType !== 19;
				}

				/* -------------------- ABILITIES -------------------- */

				if (['Aspect', 'Fragment', 'Grenade', 'Super', 'Melee'].includes(item.type)) {
					return x.itemType === 19 || itemType.includes('Ability');
				}

				/* -------------------- MODS -------------------- */

				if (item.type.includes('Mod')) {
					return (
						itemType.includes('Trait') ||
						itemType.includes('Mod') ||
						itemType.includes('Perk') ||
						itemType.includes('Catalyst') ||
						x.plug?.plugCategoryIdentifier?.includes('weapon') ||
						x.plug?.plugCategoryIdentifier?.includes('masterwork') ||
						x.plug?.plugCategoryIdentifier?.includes('intrinsics') ||
						x.plug?.plugCategoryIdentifier?.includes('v400.plugs')
					);
				}

				return true;
			}) as any;

			return {
				...item,

				icon: def?.displayProperties?.icon,

				tier: def?.inventory?.tierTypeName,
			};
		});

		return Array.from(new Map(mapped.map((item) => [`${item.type}:${item.name}`, item])).values());
	}, [definitions]);

	const filtered = resolved.filter((x) => `${x.name} ${x.type}`.toLowerCase().includes(search.toLowerCase()));

	return (
		<div className='mt-8 rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden'>
			<motion.button
				whileTap={{
					scale: 0.995,
				}}
				onClick={() => setOpen(!open)}
				className='w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition'>
				<div>
					<h2 className='text-2xl font-black text-left'>Ban List</h2>

					<p className='text-sm text-white/50 text-left mt-1'>{bannedItems.length} restrictions.</p>
				</div>

				<div className='w-9 h-9 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl flex items-center justify-center'>
					<motion.div
						animate={{
							rotate: open ? 180 : 0,
						}}
						transition={{
							duration: 0.2,
						}}>
						<ChevronDown className='w-4 h-4 text-white/70' />
					</motion.div>
				</div>
			</motion.button>

			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						initial={{
							height: 0,
							opacity: 0,
						}}
						animate={{
							height: 'auto',
							opacity: 1,
						}}
						exit={{
							height: 0,
							opacity: 0,
						}}
						transition={{
							duration: 0.25,
						}}
						className='overflow-hidden'>
						<div className='border-t border-white/10 p-5'>
							<motion.div
								initial={{
									y: -10,
									opacity: 0,
								}}
								animate={{
									y: 0,
									opacity: 1,
								}}
								transition={{
									delay: 0.05,
								}}
								className='mb-5'>
								<input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder='Search bans...'
									className='w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/20 transition'
								/>
							</motion.div>

							<motion.div layout className='grid md:grid-cols-2 xl:grid-cols-3 gap-3'>
								{filtered.length ? (
									filtered.map((item, i) => (
										<motion.div
											layout
											initial={{
												opacity: 0,
												y: 10,
												scale: 0.96,
											}}
											animate={{
												opacity: 1,
												y: 0,
												scale: 1,
											}}
											exit={{
												opacity: 0,
												scale: 0.96,
											}}
											transition={{
												delay: i * 0.01,
											}}
											whileHover={{
												y: -2,
											}}
											key={`${item.type}:${item.name}`}
											className='rounded-2xl border border-white/10 bg-black/20 p-3 flex items-center gap-3'>
											<div className='w-14 h-14 rounded-xl overflow-hidden bg-white/5 shrink-0'>
												{item.icon ? (
													<img src={`https://bungie.net${item.icon}`} alt='' className='w-full h-full object-cover' />
												) : (
													<div className='w-full h-full flex items-center justify-center text-[10px] text-white/30'>?</div>
												)}
											</div>

											<div className='min-w-0'>
												<div className='font-semibold truncate'>{item.name}</div>

												<div className='text-xs text-white/50'>{item.type}</div>

												{item.tier && <div className='text-[10px] mt-1 text-white/30'>{item.tier}</div>}
											</div>
										</motion.div>
									))
								) : (
									<motion.div
										initial={{
											opacity: 0,
										}}
										animate={{
											opacity: 1,
										}}
										className='col-span-full text-center text-white/40 py-10'>
										Whatever you’re looking for is allowed. A rare moment of freedom.
									</motion.div>
								)}
							</motion.div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

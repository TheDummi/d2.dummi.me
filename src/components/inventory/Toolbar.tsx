/** @format */

'use client';

type Props = {
	farmingEnabled: boolean;
	cleanCharacter: boolean;

	setFarmingEnabled: React.Dispatch<React.SetStateAction<boolean>>;
	setCleanCharacter: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Toolbar({ farmingEnabled, setFarmingEnabled, cleanCharacter, setCleanCharacter }: Props) {
	return (
		<div className='p-2 flex gap-5'>
			<button
				onClick={() => setFarmingEnabled((p) => !p)}
				className={`
					h-11 px-5 rounded-2xl border transition text-sm font-semibold
					${farmingEnabled ? 'border-green-400/40 bg-green-500/15 text-green-200' : 'border-white/10 bg-[#0f1115]/90 text-white/60 hover:bg-white/10'}
				`}>
				Farming {farmingEnabled ? 'ON' : 'OFF'}
			</button>

			<button
				onClick={() => {
					setCleanCharacter((p) => !p);
					setTimeout(() => setCleanCharacter((p) => !p), 1500);
				}}
				className={`
					h-11 px-5 rounded-2xl border transition text-sm font-semibold
					${cleanCharacter ? 'border-green-400/40 bg-green-500/15 text-green-200' : 'border-white/10 bg-[#0f1115]/90 text-white/60 hover:bg-white/10'}
				`}>
				Clean
			</button>
		</div>
	);
}

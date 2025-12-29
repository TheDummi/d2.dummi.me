/** @format */

// CharacterContext.tsx
'use client';

import { createContext, useContext, useState } from 'react';

type CharacterContextType = {
	activeCharacterId: string | null;
	setActiveCharacterId: (id: string) => void;
};

const CharacterContext = createContext<CharacterContextType | null>(null);

export function CharacterProvider({ children }: { children: React.ReactNode }) {
	const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);

	return <CharacterContext.Provider value={{ activeCharacterId, setActiveCharacterId }}>{children}</CharacterContext.Provider>;
}

export function useCharacter() {
	const ctx = useContext(CharacterContext);
	if (!ctx) throw new Error('useCharacter must be used inside CharacterProvider');
	return ctx;
}

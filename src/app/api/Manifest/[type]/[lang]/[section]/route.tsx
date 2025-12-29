/** @format */

'use server';

import { NextResponse } from 'next/server';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

/**
 * Simple in-memory cache
 * key = manifest path (already versioned by Bungie)
 */
const manifestCache = new Map<string, any>();

export async function GET(req: any, { params }: any) {
	const { type, lang, section } = await params;

	const session: any = await getServerSession(authOptions);

	if (!session?.manifest?.[type]?.[lang]?.[section]) {
		return NextResponse.json({ error: 'Invalid manifest path' }, { status: 400 });
	}

	const manifestPath = session.manifest[type][lang][section];

	/* -------------------- CACHE HIT -------------------- */
	if (manifestCache.has(manifestPath)) {
		return NextResponse.json(manifestCache.get(manifestPath));
	}

	/* -------------------- FETCH & CACHE -------------------- */
	const data = await fetch(`https://www.bungie.net${manifestPath}`).then((res) => res.json());

	manifestCache.set(manifestPath, data);

	return NextResponse.json(data);
}

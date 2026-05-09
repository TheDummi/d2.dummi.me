/** @format */

'use server';

import { NextResponse } from 'next/server';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

/**
 * In-memory manifest cache
 */

type CacheEntry = {
	data: any;
	timestamp: number;
};

const manifestCache = new Map<string, CacheEntry>();

/**
 * 24 hours
 */

const CACHE_TTL = 1000 * 60 * 60 * 24;

export async function GET(req: any, { params }: any) {
	const { type, lang, section } = await params;

	const session: any = await getServerSession(authOptions);

	if (!session?.manifest?.[type]?.[lang]?.[section]) {
		return NextResponse.json(
			{
				error: 'Invalid manifest path',
			},
			{
				status: 400,
			}
		);
	}

	const manifestPath = session.manifest[type][lang][section];

	const now = Date.now();

	/* -------------------- CACHE HIT -------------------- */

	const cached = manifestCache.get(manifestPath);

	if (cached) {
		const isFresh = now - cached.timestamp < CACHE_TTL;

		if (isFresh) {
			console.log('[Manifest Cache] HIT', type);

			return NextResponse.json(cached.data, {
				headers: {
					'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
				},
			});
		}

		console.log('[Manifest Cache] EXPIRED', type);

		manifestCache.delete(manifestPath);
	}

	/* -------------------- FETCH -------------------- */

	console.log('[Manifest Cache] MISS', type);

	const res = await fetch(`https://www.bungie.net${manifestPath}`, {
		next: {
			revalidate: 86400,
		},
	});

	if (!res.ok) {
		return NextResponse.json(
			{
				error: 'Failed to fetch manifest',
			},
			{
				status: 500,
			}
		);
	}

	const data = await res.json();

	/* -------------------- STORE CACHE -------------------- */

	manifestCache.set(manifestPath, {
		data,
		timestamp: now,
	});

	return NextResponse.json(data, {
		headers: {
			'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
		},
	});
}

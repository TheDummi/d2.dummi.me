/** @format */
'use server';

import { NextResponse } from 'next/server';
import { getRulesets } from '@/lib/rules';

export async function GET() {
	const rulesets = getRulesets();

	return NextResponse.json(rulesets, {
		headers: {
			'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
		},
	});
}

/** @format */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const { itemReferenceHash, stackSize, itemId, characterId, membershipType, accessToken } = await request.json();

		const response = await fetch('https://www.bungie.net/Platform/Destiny2/Actions/Items/PullFromPostmaster/', {
			method: 'POST',

			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'X-API-Key': process.env.BUNGIE_API_KEY!,
				'Content-Type': 'application/json',
			},

			body: JSON.stringify({
				itemReferenceHash,
				stackSize,
				itemId,
				characterId,
				membershipType,
			}),
		});

		const data = await response.json();

		if (!response.ok || data.ErrorCode !== 1) {
			console.error('POSTMASTER PULL FAILED', data);

			return NextResponse.json(data, {
				status: response.status || 500,
			});
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error('POSTMASTER ROUTE ERROR', error);

		return NextResponse.json(
			{
				ErrorCode: -1,
				Message: error instanceof Error ? error.message : 'Unknown error',
			},
			{
				status: 500,
			}
		);
	}
}

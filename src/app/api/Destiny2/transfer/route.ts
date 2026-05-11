/** @format */

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
	try {
		const body = await req.json();

		const { itemReferenceHash, stackSize = 1, transferToVault, itemId, characterId, membershipType, accessToken } = body;

		const response = await fetch('https://www.bungie.net/Platform/Destiny2/Actions/Items/TransferItem/', {
			method: 'POST',

			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'X-API-Key': process.env.BUNGIE_API_KEY!,
				'Content-Type': 'application/json',
			},

			body: JSON.stringify({
				itemReferenceHash,
				stackSize,
				transferToVault,
				itemId,
				characterId,
				membershipType,
			}),
		});

		const data = await response.json();

		return NextResponse.json(data, {
			status: response.status,
		});
	} catch (err: any) {
		return NextResponse.json(
			{
				error: err.message,
			},
			{
				status: 500,
			}
		);
	}
}

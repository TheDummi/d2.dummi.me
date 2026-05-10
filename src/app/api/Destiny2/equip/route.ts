/** @format */

import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

export async function POST(req: NextRequest) {
	try {
		const session: any = await getServerSession(authOptions);

		if (!session?.accessToken) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();

		const response = await fetch('https://www.bungie.net/Platform/Destiny2/Actions/Items/EquipItem/', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${session.accessToken}`,
				'X-API-Key': process.env.BUNGIE_API_KEY!,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				itemId: body.itemId,
				characterId: body.characterId,
				membershipType: body.membershipType,
			}),
		});

		const data = await response.json();

		return NextResponse.json(data);
	} catch (err) {
		console.error(err);

		return NextResponse.json({ error: 'Failed to equip item' }, { status: 500 });
	}
}

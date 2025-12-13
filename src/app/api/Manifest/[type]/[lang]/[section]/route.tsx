/** @format */

'use server';

import { NextResponse } from 'next/server';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

export async function GET(req: any, { params }: any) {
	const { type, lang, section } = await params;
	const session: any = await getServerSession(authOptions);
	const manifest = session.manifest[type][lang][section];

	const data = await fetch(`https://www.bungie.net${manifest}`).then((res) => res.json());

	return NextResponse.json(data);
}

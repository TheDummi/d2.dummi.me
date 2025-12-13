/** @format */

import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bungieFetch from '@/../public/functions/bungieFetch';
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ membershipType: string; membershipId: string; components: string }> }) {
	const { membershipType, membershipId, components } = await params;
	const session: any = await getServerSession(authOptions);

	const data = await bungieFetch(`/Destiny2/${membershipType}/Profile/${membershipId}?components=${components}`, session.accessToken!).catch(() => null);

	return NextResponse.json(data);
}

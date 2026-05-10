/** @format */

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

async function bungieFetch(path: string, accessToken: string, body?: any) {
	console.log(path);
	const response = await fetch(`https://www.bungie.net/Platform${path}`, {
		method: body ? 'POST' : 'GET',

		headers: {
			'Authorization': `Bearer ${accessToken}`,

			'X-API-Key': process.env.BUNGIE_API_KEY!,

			'Content-Type': 'application/json',
		},

		body: body ? JSON.stringify(body) : undefined,
	});

	const data = await response.json();

	if (!response.ok || data.ErrorCode !== 1) {
		console.error(data);

		throw new Error(data.Message || 'Bungie API Error');
	}

	return data;
}

export async function POST(req: Request) {
	try {
		const session: any = await getServerSession(authOptions);

		if (!session?.accessToken) {
			return Response.json(
				{
					ok: false,
					error: 'Unauthorized',
				},
				{
					status: 401,
				}
			);
		}

		const body = await req.json();

		const { itemInstanceId, socketIndex, plugHash, characterId, membershipType } = body;

		if (!itemInstanceId || socketIndex === undefined || !plugHash || !characterId || !membershipType) {
			return Response.json(
				{
					ok: false,
					error: 'Missing fields',
				},
				{
					status: 400,
				}
			);
		}

		const result = await bungieFetch('/Destiny2/Actions/Items/InsertSocketPlug/', session.accessToken, {
			itemInstanceId,

			socketIndex,

			plugItemHash: plugHash,

			characterId,

			membershipType,
		});

		return Response.json({
			ok: true,
			response: result.Response,
		});
	} catch (err: any) {
		console.error(err);

		return Response.json(
			{
				ok: false,
				error: err.message,
			},
			{
				status: 500,
			}
		);
	}
}

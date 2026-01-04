/** @format */

export default async function bungieFetch(endpoint: string, accessToken: string) {
	const response = await fetch(`https://www.bungie.net/Platform${endpoint}`, {
		headers: {
			'X-API-Key': process.env.BUNGIE_API_KEY!,
			'Authorization': `Bearer ${accessToken}`,
		},
	});

	if (!response.ok) return null;

	const { Response } = await response.json();

	return Response;
}

/** @format */

import triumphs from '@/../public/data/triumphs.json';

export default function triumphFormatter(manifest: Record<string, any>) {
	const formattedManifest: Record<string, any> = {};

	for (const [hash, record] of Object.entries(manifest)) {
		formattedManifest[hash] = { ...record, ...triumphs[hash as keyof typeof triumphs] };
	}

	return formattedManifest;
}

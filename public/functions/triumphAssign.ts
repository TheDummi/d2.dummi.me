/** @format */

import triumphs from '@/../public/data/triumphs.json';

export default function triumphAssign(manifest: any) {
	for (const [hash, triumph] of Object.entries(manifest) as any) {
		if (triumphs?.[hash as keyof typeof triumphs]) triumph.titleInfo = triumphs[hash as keyof typeof triumphs];
	}

	return manifest;
}

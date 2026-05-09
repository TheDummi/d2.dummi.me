/** @format */

import fs from 'fs';
import path from 'path';

const rulesPath = path.join(process.cwd(), 'src', 'lib', 'rules');

export function getRulesets() {
	const files = fs.readdirSync(rulesPath).filter((file) => file !== 'index.ts' && file.endsWith('.ts'));

	return Object.fromEntries(
		files.map((file) => {
			const name = file.replace('.ts', '');

			const mod = require(`@/lib/rules/${name}`).default;

			return [name, mod];
		})
	);
}

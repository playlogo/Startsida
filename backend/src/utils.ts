export async function exists(path: string) {
	try {
		await Deno.stat(path);

		return true;
	} catch (err) {
		if (err instanceof Deno.errors.NotFound) {
			return false;
		}

		throw err;
	}
}

export async function loadConfig(name: string, configVersion: number) {
	if (!(await exists(`./data/${name}.json`))) {
		// No config
		if (!(await exists(`./data`))) {
			await Deno.mkdir(`./data`);
		}

		// Copy default config
		await Deno.copyFile(`./schemas/${name}.default.json`, `./data/${name}.json`);

		return {};
	}

	// Try to config
	let parsed;

	try {
		const content = await Deno.readTextFile(`./data/${name}.json`);
		parsed = JSON.parse(content);
	} catch (err) {
		if (err instanceof SyntaxError) {
			console.error(`Config file './data/${name}.json' contains invalid json. Exiting`);
			Deno.exit(1);
		}
	}

	// If config version matches end
	if (parsed.version === configVersion) {
		return parsed;
	}

	// If mismatch backup old config
	await Deno.copyFile(`./data/${name}.json`, `./data/${name}.backup.${parsed.version}.json`);

	// Copy default config
	await Deno.copyFile(`./schemas/${name}.default.json`, `./data/${name}.json`);

	return {};
}

import { encodeHex } from "jsr:@std/encoding/hex";

export async function hash(content: string) {
	// From: https://docs.deno.com/examples/hashing/
	const messageBuffer = new TextEncoder().encode(content);
	const hashBuffer = await crypto.subtle.digest("SHA-256", messageBuffer);

	return encodeHex(hashBuffer);
}

class CacheManager {
	// Hash -> File extension
	index: { [key: string]: string } = {};

	async init() {
		await Deno.mkdir(`./cache`, { recursive: true });

		for await (const dir of Deno.readDir(`./cache/`)) {
			if (!dir.isDirectory) {
				continue;
			}

			if (dir.name.length !== 2) {
				continue;
			}

			for await (const file of Deno.readDir(`./cache/${dir.name}/`)) {
				this.index[file.name.split(".")[0]] = file.name.split(".")[1];
			}
		}
	}

	has(hash: string): boolean {
		return this.index[hash] !== undefined;
	}

	get(hash: string): string {
		if (!this.has(hash)) {
			throw new Error(`[cache] [get] Unknown hash: ${hash}`);
		}

		return `./cache/${hash.slice(0, 2)}/${hash}.${this.index[hash]}`;
	}

	async download(hash: string, url: string) {
		const fileType = new URL(url).pathname.split("/").reverse()[0].split(".")[1];
		const path = `./cache/${hash.slice(0, 2)}/${hash}.${fileType}`;

		// Overwrite, if already exists
		if (this.has(hash)) {
			await Deno.remove(path);
		} else {
			// Ensure dir exists
			await Deno.mkdir(`./cache/${hash.slice(0, 2)}`, { recursive: true });
		}

		// Download to cache
		const res = await fetch(url);

		const file = await Deno.open(path, { create: true, write: true });

		await res.body!.pipeTo(file.writable);

		// Store for later
		this.index[hash] = fileType;

		return path;
	}
}

export default new CacheManager();

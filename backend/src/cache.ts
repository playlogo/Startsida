class CacheManager {
	index: string[] = [];

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
				this.index.push(file.name);
			}
		}
	}

	has(hash: string): boolean {
		return this.index.includes(hash);
	}

	get(hash: string): string {
		return `./cache/${hash.slice(0, 2)}/${hash}`;
	}

	async download(hash: string, url: string) {
		const path = `./cache/${hash.slice(0, 2)}/${hash}`;

		if (this.has(hash)) {
			// Overwriting
			await Deno.remove(path);
		}

		const res = await fetch(url);
		const file = await Deno.open(path, { create: true, write: true });

		await res.body!.pipeTo(file.writable);

		file.close();

		return path;
	}
}

export default new CacheManager();

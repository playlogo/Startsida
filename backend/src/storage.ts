import { exists } from "./utils.ts";

class StorageManager {
	// Hash -> File extension
	#bucketIndex: { [key: string]: string } = {};

	// Key -> Value
	#storageIndex: { [key: string]: any } = {};

	#CACHE_DIR = `./cache`;

	async init() {
		await Deno.mkdir(this.#CACHE_DIR, { recursive: true });

		// Collect bucket entries
		for await (const dir of Deno.readDir(this.#CACHE_DIR)) {
			if (!dir.isDirectory) {
				continue;
			}

			if (dir.name.length !== 2) {
				continue;
			}

			for await (const file of Deno.readDir(`${this.#CACHE_DIR}/${dir.name}/`)) {
				this.#bucketIndex[file.name.split(".")[0]] = file.name.split(".")[1];
			}
		}

		// Collect Key-Value entries
		if (await exists(`${this.#CACHE_DIR}e/storage.json`)) {
			// Try to parse it
			try {
				const content = await Deno.readTextFile(`${this.#CACHE_DIR}/storage.json`);
				const parsed = JSON.parse(content);

				this.#storageIndex = parsed;
			} catch (err) {
				if (err instanceof SyntaxError) {
					console.error(`[storage] storage.json contains invalid json.`);
				} else {
					throw err;
				}
			}
		}
	}

	/* Key-Value storage */
	get storage() {
		const storage_has = this.#storage_has.bind(this);
		const storage_get = this.#storage_get.bind(this);
		const storage_set = this.#storage_set.bind(this);

		return {
			has: storage_has,
			get: storage_get,
			set: storage_set,
		};
	}

	#storage_has(key: string) {
		return this.#storageIndex[key] !== undefined;
	}

	#storage_get<T>(key: string, fallback?: T): T {
		if (fallback !== undefined) {
			if (!this.#storage_has(key)) {
				return fallback;
			}
		}

		return this.#storageIndex[key] as T;
	}

	async #storage_set(key: string, value: any) {
		this.#storageIndex[key] = value;

		// Store to disk
		try {
			const stringified = JSON.stringify(this.#storageIndex);
			await Deno.writeTextFile(`${this.#CACHE_DIR}/storage.json`, stringified);
		} catch (_err) {
			console.error(`[storage] [set] Failed to stringify storage index.`);
		}
	}

	/* Bucket like file storage */
	get bucket() {
		const bucket_has = this.#bucket_has.bind(this);
		const bucket_get = this.#bucket_get.bind(this);
		const bucket_download = this.#bucket_download.bind(this);

		return {
			has: bucket_has,
			get: bucket_get,
			download: bucket_download,
		};
	}

	#bucket_has(hash: string): boolean {
		return this.#bucketIndex[hash] !== undefined;
	}

	#bucket_get(hash: string): string {
		if (!this.#bucket_has(hash)) {
			throw new Error(`[storage] [get] Unknown hash: ${hash}`);
		}

		return `./cache/${hash.slice(0, 2)}/${hash}.${this.#bucketIndex[hash]}`;
	}

	async #bucket_download(hash: string, url: string) {
		const fileType = new URL(url).pathname.split("/").reverse()[0].split(".")[1];
		const path = `${this.#CACHE_DIR}/${hash.slice(0, 2)}/${hash}.${fileType}`;

		// Overwrite, if already exists
		if (this.#bucket_has(hash)) {
			await Deno.remove(path);
		} else {
			// Ensure dir exists
			await Deno.mkdir(`${this.#CACHE_DIR}/${hash.slice(0, 2)}`, { recursive: true });
		}

		// Download to cache
		const res = await fetch(url);

		const file = await Deno.open(path, { create: true, write: true });

		await res.body!.pipeTo(file.writable);

		// Store for later
		this.#bucketIndex[hash] = fileType;

		return path;
	}
}

export default new StorageManager();

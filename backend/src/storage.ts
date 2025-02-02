import { parse } from "jsr:@std/toml";

import { exists } from "./utils.ts";

class StorageManager {
	#CACHE_DIR = `./cache`;

	// Hash -> File extension
	#bucketIndex: { [key: string]: string } = {};

	// Key -> Value
	#storageIndex: { [key: string]: any } = {};

	// Key -> Value
	#configIndex: { [key: string]: any } = {};

	async init() {
		await Deno.mkdir(this.#CACHE_DIR, { recursive: true });

		// Buckets: Collect
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

		// Config: Load & Parse
		if (await exists(`data/config.toml`)) {
			try {
				const content = await Deno.readTextFile(`data/config.toml`);
				const parsed = parse(content);

				this.#configIndex = parsed;
			} catch (err) {
				if (err instanceof SyntaxError) {
					console.error(`[storage] config.toml contains invalid toml.`);
				} else {
					throw err;
				}
			}
		}

		// Key-Value: Load & Parse
		if (await exists(`${this.#CACHE_DIR}/storage.json`)) {
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

		// Start git pull loop
		if (this.#configIndex["repo"] !== undefined) {
			console.log(`[storage] [git] Syncing enabled`);
			await this.#runGit();
		} else {
			console.log(`[storage] [git] Syncing disabled`);
		}
	}

	async #runGit() {
		const repoConfig = this.#configIndex["repo"] as {
			url: string;
			branch: string;
			interval: number;
		};

		const cwd = "data/";

		// Try to clone repo if not existing
		if (repoConfig.url !== "") {
			const dirContents = await Array.fromAsync(Deno.readDir("data/"));

			if (dirContents.length === 1) {
				console.log(`[storage] [git] Cloning repo`);

				// Only the config file is present -> Clone repo
				await this.#exec("git", ["init"], cwd);
				await this.#exec("git", ["checkout", "-b", repoConfig.branch], cwd);
				await this.#exec("git", ["remote", "add", "origin", repoConfig.url], cwd);

				const [branchExists] = await this.#exec("git", ["pull", `origin/${repoConfig.branch}`], cwd);

				if (branchExists) {
					await this.#exec(
						"git",
						["branch", `--set-upstream-to=origin/${repoConfig.branch}`, repoConfig.branch],
						cwd
					);
				}
			}
		}

		// Check if local changes can be committed
		await this.#exec("git", ["add", "-A"], cwd);
		const [commit_success, commit_stdout, commit_stderr] = await this.#exec(
			"git",
			["commit", "-m", "Automated sync commit"],
			cwd
		);

		// Fetch & Pull & Push
		await this.#exec("git", ["fetch"], cwd);
		await this.#exec("git", ["config", "pull.rebase", "false"], cwd);

		const [pull_success, pull_stdout, pull_stderr] = await this.#exec(
			"git",
			["pull", "origin", repoConfig.branch, "--allow-unrelated-histories"],
			cwd
		);

		// Push if changes are present
		if (!commit_stdout.includes("nothing to commit") && commit_stderr.length === 0) {
			console.log(`[storage] [git] Local changes pushed`);
			await this.#exec("git", ["push", "-u", "origin", `${repoConfig.branch}`], cwd);
		}

		// Restart if changes detected
		if (!pull_stdout.includes("Already up to date.") && pull_stdout.includes("Fast-forward")) {
			console.log(`[storage] [git] Remote changes pulled, restarting`);
			Deno.exit(0);
		}

		// Schedule re-execution
		const cb = () => {
			this.#runGit();
		};

		setTimeout(cb.bind(this), 1000 * 60 * repoConfig.interval);
	}

	async #exec(
		cmd: string,
		args: string[],
		cwd: string | undefined = undefined,
		noFail: boolean = true
	): Promise<[boolean, string, string]> {
		const command = new Deno.Command(cmd, {
			args: args,
			cwd: cwd,
			stdout: "piped",
			stderr: "piped",
		});

		try {
			const { success, stdout, stderr } = await command.output();
			const parsed_stdout = new TextDecoder().decode(stdout);
			const parsed_stderr = new TextDecoder().decode(stderr);

			return [success, parsed_stdout, parsed_stderr];
		} catch (err) {
			if (!noFail) {
				throw err;
			}
			return [false, "", ""];
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

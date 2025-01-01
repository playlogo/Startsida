import { Router } from "https://deno.land/x/oak@v17.1.3/mod.ts";
import { encodeHex } from "jsr:@std/encoding/hex";

import cache from "../../cache.ts";

import { loadConfig } from "../../utils.ts";
import { gatherIconURL } from "./icons.ts";

import Module from "../_module.ts";

class BookmarksManager extends Module {
	configSchemaVersion = 1;
	config: { [key: string]: (string | { name: string; url: string })[] } = {};

	groups: Group[] = [];

	override async collect() {
		// Load config
		this.config = await loadConfig("bookmarks", this.configSchemaVersion);

		// Parse config
		await this.parseConfig();
	}

	async parseConfig() {
		for (const [key, value] of Object.entries(this.config)) {
			if (key === "$schema" || key === "version") {
				continue;
			}

			const group = new Group(key);
			this.groups.push(group);

			for (const entry of value) {
				let bookmark;

				if (typeof entry === "string") {
					bookmark = new Bookmark(entry, entry);
				} else {
					bookmark = new Bookmark(entry.name, entry.url);
				}

				try {
					await bookmark.collectIcon();
					group.entries.push(bookmark);
				} catch (err) {
					console.error(`[bookmarks] Unable to collect icon for ${bookmark.name}`);
					console.error(err);
				}
			}
		}
	}

	/* Rest */
	override buildRouter() {
		this.okaRouter = new Router({ prefix: "/bookmarks" });
	}
}

class Group {
	name: string;
	entries: Bookmark[] = [];

	constructor(name: string) {
		this.name = name;
	}
}

class Bookmark {
	name: string;
	url: string;
	hash: string | undefined = undefined;

	image: string | undefined = "";

	constructor(name: string, url: string) {
		this.name = name;
		this.url = url;
	}

	async collectIcon() {
		if (this.hash === undefined) {
			await this.genHash();
		}

		// Check if locally cached
		if (cache.has(this.hash!)) {
			this.image = cache.get(this.hash!);
		} else {
			// Download
			const url = await gatherIconURL(this.url, this.name);
			this.image = await cache.download(this.hash!, url);
		}
	}

	async genHash() {
		// From: https://docs.deno.com/examples/hashing/
		const messageBuffer = new TextEncoder().encode(`${this.name}|${this.url}`);
		const hashBuffer = await crypto.subtle.digest("SHA-256", messageBuffer);

		this.hash = encodeHex(hashBuffer);
	}
}

export default new BookmarksManager();

import { Router, send } from "https://deno.land/x/oak@v17.1.3/mod.ts";
import { encodeHex } from "jsr:@std/encoding/hex";

import cache from "../../cache.ts";

import { loadConfig } from "../../utils.ts";
import { gatherIconURL } from "./icons.ts";
import { Entry } from "../../common.ts";

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
		const promises: Promise<void>[] = [];

		for (const [key, value] of Object.entries(this.config)) {
			if (key === "$schema" || key === "version") {
				continue;
			}

			const group = new Group(key);
			this.groups.push(group);

			for (const entry of value) {
				let bookmark;

				if (typeof entry === "string") {
					bookmark = new Bookmark(entry.split("|")[0], entry.split("|")[1]);
				} else {
					bookmark = new Bookmark(entry.name, entry.url);
				}

				promises.push(bookmark.collectIcon());
				group.entries.push(bookmark);
			}
		}

		await Promise.allSettled(promises);
	}

	override entries(): Entry[] {
		const res = [];

		for (const group of this.groups) {
			res.push(...group.common());
		}

		return res;
	}

	/* Rest */
	override buildRouter() {
		this.okaRouter = new Router({ prefix: "/bookmarks" });

		this.okaRouter.get("/images/:hash", async (ctx) => {
			const hash = ctx.params.hash.split(".")[0];

			if (!cache.has(hash)) {
				ctx.response.status = 404;
				return;
			}

			await send(ctx, cache.get(hash), {
				root: "./",
			});
		});
	}
}

class Group {
	name: string;
	entries: Bookmark[] = [];

	constructor(name: string) {
		this.name = name;
	}

	common() {
		const res = [];

		for (const entry of this.entries) {
			res.push(entry.common(this.name));
		}

		return res;
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

	common(group: string): Entry {
		return {
			id: this.hash!,

			name: this.name,
			icon: {
				type: "image",
				url: `/bookmarks/images/${this.image!.split("/").slice(-1)[0]}`,
			},

			click: {
				type: "href",
				url: this.url,
			},

			group: group,
			module: "Bookmarks",
		};
	}
}

export default new BookmarksManager();

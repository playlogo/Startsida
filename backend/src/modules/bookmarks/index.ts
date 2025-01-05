import { Router, send } from "https://deno.land/x/oak@v17.1.3/mod.ts";

import storage from "../../storage.ts";

import { hash, loadConfig } from "../../utils.ts";
import { gatherIconURL } from "./icons.ts";
import { Entry, Module } from "../../common.ts";

class BookmarksManager extends Module {
	configSchemaVersion = 1;
	config: { [key: string]: (string | { name: string; url: string; icon: string })[] } = {};

	groups: Group[] = [];

	fallbackImage: string = "";

	// Bookmark hash -> Bookmark class
	bookmarks: { [key: string]: Bookmark } = {};

	override async collect() {
		// Load config
		this.config = await loadConfig("bookmarks", this.configSchemaVersion);

		// Load fallback image
		const fallbackImageUrl = "https://wikimedia.org/static/images/project-logos/enwiki.png";

		this.fallbackImage = (await storage.bucket.download(await hash(fallbackImageUrl), fallbackImageUrl))
			.split("/")
			.slice(-1)[0];

		// Parse config
		await this.parseConfig();

		// Start GatherMissingIcons task
		this.#startGatheringMissingIcons();
	}

	#startGatheringMissingIcons() {
		// Run every hour at 00:XX
		Deno.cron("gatherMissingIcons", "0 * * * *", async () => {
			// Gather missing icons
			const notFoundIcons = storage.storage.get("bookmarks/icons/notFound", []) as string[] | undefined;

			if (notFoundIcons === undefined) {
				// None missing - Great!
				return;
			}

			// Try to regather them
			const foundOnes: string[] = [];

			for (const hash of notFoundIcons) {
				const bookmark = bookmarkManager.bookmarks[hash];

				let url;

				try {
					url = await gatherIconURL(bookmark.url, bookmark.name)!;
				} catch (err) {
					if (!(err instanceof Deno.errors.NotFound)) {
						console.error(err);
					}

					continue;
				}

				try {
					bookmark.icon = await storage.bucket.download(bookmark.hash!, url);
				} catch (err) {
					console.error(err);
					continue;
				}

				console.log(`[bookmarks] [gatherMissingIcons] Found icon for ${bookmark.name}`);
				foundOnes.push(hash);
			}

			console.log(`[bookmarks] [gatherMissingIcons] Found ${foundOnes.length} missing icons`);

			// Store found ones
			await storage.storage.set(
				"bookmarks/icons/notFound",
				notFoundIcons.filter((entry) => !foundOnes.includes(entry))
			);
		});
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
					bookmark = new Bookmark(entry.name, entry.url, entry.icon);
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

			if (!storage.bucket.has(hash)) {
				ctx.response.status = 404;
				return;
			}
			try {
				await send(ctx, storage.bucket.get(hash), {
					root: "./",
				});
			} catch (err) {
				console.error(err);
				ctx.response.body = "ERROR";
				ctx.response.status = 400;
			}
		});
	}
}

const bookmarkManager = new BookmarksManager();

export default bookmarkManager;

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

	icon: string | undefined;

	constructor(name: string, url: string, icon: string | undefined = undefined) {
		this.name = name;
		this.url = url;
		this.icon = icon;
	}

	async collectIcon() {
		if (this.hash === undefined) {
			this.hash = await hash(`${this.name}|${this.url}`);
		}

		// Add self to manager if not already
		if (bookmarkManager.bookmarks[this.hash] === undefined) {
			bookmarkManager.bookmarks[this.hash] = this;
		}

		// Check if icon loacally cached
		if (storage.bucket.has(this.hash!)) {
			this.icon = storage.bucket.get(this.hash!);
			return;
		}

		// Check if manual image overwrite
		if (this.icon !== undefined) {
			try {
				this.icon = await storage.bucket.download(this.hash!, this.icon);
				console.log(`[bookmarks] Using manual icon for ${this.name}`);
			} catch (err) {
				console.error(
					`[bookmarks] Unable to download manual icon for ${this.name} from ${this.icon}`
				);
				throw err;
			}
			return;
		}

		// Gather & Download
		try {
			const url = await gatherIconURL(this.url, this.name);
			this.icon = await storage.bucket.download(this.hash!, url);
		} catch (err) {
			if (err instanceof Deno.errors.NotFound) {
				console.warn(err.message);

				// Unable to gather icon, store for cron task
				const array = storage.storage.get("bookmarks/icons/notFound", []) as string[];

				if (!array.includes(this.hash)) {
					array.push(this.hash);
				}

				await storage.storage.set("bookmarks/icons/notFound", array);
			} else {
				throw err;
			}
		}
	}

	common(group: string = ""): Entry {
		return {
			id: this.hash!,

			name: this.name,
			icon: {
				type: "image",
				url: `/bookmarks/images/${
					this.icon === undefined
						? bookmarkManager.fallbackImage
						: this.icon.split("/").slice(-1)[0]
				}`,
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

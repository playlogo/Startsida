/*
	Serve wallpapers
*/

import { Router, send } from "https://deno.land/x/oak@v17.1.3/mod.ts";

import { Module } from "local/src/common.ts";
import { exists } from "local/src/utils.ts";

const WALLPAPER_DIRECTORY = "wallpapers/";

class WallpaperManager extends Module {
	wallpapers: string[] = [];

	override async collect() {
		// Check if custom wallpapers exist
		if (!(await exists(`./data/${WALLPAPER_DIRECTORY}`))) {
			// Copy default wallpapers
			await Deno.mkdir(`./data/${WALLPAPER_DIRECTORY}`, { recursive: true });

			for await (const entry of Deno.readDir(`./default_wallpapers`)) {
				if (!entry.isFile) {
					continue;
				}

				await Deno.copyFile(
					`./default_wallpapers/${entry.name}`,
					`./data/${WALLPAPER_DIRECTORY}/${entry.name}`
				);
			}

			console.log("[wallpapers] Copied default wallpapers");
		}

		// Scan directory for wallpapers
		for await (const wallpaper of Deno.readDir(`./data/${WALLPAPER_DIRECTORY}`)) {
			if (!wallpaper.isFile) {
				continue;
			}

			this.wallpapers.push(wallpaper.name);
		}
	}

	override buildRouter(): void {
		this.okaRouter = new Router({ prefix: "/wallpapers" });

		this.router.get("/", (ctx) => {
			ctx.response.body = wallpaperManager.wallpapers;
		});

		this.router.get("/:wallpaper", async (ctx) => {
			try {
				await send(ctx, ctx.params.wallpaper, {
					root: `./data/${WALLPAPER_DIRECTORY}`,
				});
			} catch (err) {
				console.error(err);
				ctx.response.body = "ERROR";
				ctx.response.status = 400;
			}
		});
	}
}

const wallpaperManager = new WallpaperManager();

export default wallpaperManager;

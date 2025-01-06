/*
    Apply bumbleCore scenes
*/

import { Router } from "https://deno.land/x/oak@v17.1.3/mod.ts";

import { Entry, Module } from "local/src/common.ts";
import { loadConfig } from "local/src/utils.ts";

class BumbleCoreManager extends Module {
	configSchemaVersion = 1;
	config: { [key: string]: string[] | string } = {};

	groups: Group[] = [];

	scenes: { [key: string]: Scene } = {};

	url: string = "";

	override icon = {
		name: "BumbleCore",
		icon: "material-symbols:lightbulb-2-outline",
		colors: {
			background: "#1e2024",
			icon: "white",
		},
	};

	override async collect() {
		// Load config
		this.config = await loadConfig("bumble", this.configSchemaVersion);

		// Request scene list
		if (this.config["url"] === undefined) {
			throw new Error(`[bumble] No url defined in config`);
		}

		this.url = this.config["url"] as string;

		const scenes = (await (await fetch(`${this.url}/api/scenes/`)).json()) as {
			name: string;
			favorite: boolean;
			icon: string;
			colors: { primary: string; secondary: string };
		}[];

		for (const scene of scenes) {
			this.scenes[scene.name] = new Scene(scene.name, scene.icon, [
				scene.colors.primary,
				scene.colors.secondary,
			]);
		}

		// Parse config
		await this.parseConfig();
	}

	parseConfig() {
		for (const [key, value] of Object.entries(this.config)) {
			if (key === "$schema" || key === "version" || key === "url") {
				continue;
			}

			const group = new Group(key);

			for (const entry of value) {
				if (entry === "*") {
					group.entries = Object.values(this.scenes);
					continue;
				}

				if (this.scenes[entry] === undefined) {
					console.error(`[bumble] Group '${key}' scene '${entry}' not found`);
					continue;
				}

				group.entries.push(this.scenes[entry]);
			}

			this.groups.push(group);
		}
	}

	override entries(): Entry[] {
		const res = [];

		for (const group of this.groups) {
			res.push(...group.common());
		}

		return res;
	}

	override buildRouter(): void {
		this.okaRouter = new Router({ prefix: "/bumble" });

		this.router.post("/:scene/apply", async (ctx) => {
			const sceneName = ctx.params.scene.replaceAll("%2F", "/");

			console.log(`[bumble] Applying scene: ${sceneName}`);

			try {
				const res = await fetch(`${this.url}/api/scenes/${sceneName.replaceAll("/", "%2F")}/load`);

				if (res.ok) {
					ctx.response.body = "OK";
					return;
				}

				throw new Error(`${res.status} | ${res.statusText}`);
			} catch (err) {
				ctx.response.body = "ERROR";
				ctx.response.status = 400;

				console.error(err);
			}
		});
	}
}

const bumbleCoreManager = new BumbleCoreManager();

export default bumbleCoreManager;

class Scene {
	name: string;
	icon: string;
	colors: string[];

	id: string; // For internal tracking

	constructor(name: string, icon: string, gradient: string[]) {
		this.name = name;
		this.icon = icon;
		this.colors = gradient;

		this.id = crypto.randomUUID();
	}

	common(group: string): Entry {
		return {
			id: this.id,
			name: this.name,
			icon: {
				type: "iconGradient",
				icon: this.icon,
				colors: {
					primary: this.colors[0],
					secondary: this.colors[1],
					icon: "white",
				},
			},
			click: {
				type: "api",
				endpoint: `/bumble/${this.name.replaceAll("/", "%2F")}/apply`,
			},
			module: "BumbleCore",

			group: group,
		};
	}
}

class Group {
	name: string;
	entries: Scene[] = [];

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

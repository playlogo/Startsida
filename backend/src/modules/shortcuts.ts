/*
	Run commands on the command line 
*/

import { Router } from "https://deno.land/x/oak@v17.1.3/mod.ts";

import { Entry, Module } from "local/src/common.ts";
import { loadConfig } from "local/src/utils.ts";

class ShortcutsManager extends Module {
	configSchemaVersion = 1;
	config: { [key: string]: { [key: string]: { icon: string; cmd: string } } } = {};

	groups: Group[] = [];
	shortcuts: { [key: string]: Shortcut } = {};

	override icon = {
		name: "Shortcuts",
		icon: "iconoir:apple-shortcuts",
		colors: {
			background: "#1c1e59",
			icon: "#f75c73",
		},
	};

	override async collect() {
		// Load config
		this.config = await loadConfig("shortcuts", this.configSchemaVersion);

		// Parse config
		this.parseConfig();
	}

	parseConfig() {
		for (const [key, value] of Object.entries(this.config)) {
			if (key === "$schema" || key === "version") {
				continue;
			}

			const group = new Group(key);
			for (const [shortcutName, shortcutConfig] of Object.entries(value)) {
				const shortcut = new Shortcut(shortcutName, shortcutConfig.icon, shortcutConfig.cmd);

				this.shortcuts[shortcut.id] = shortcut;
				group.entries.push(shortcut);
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
		this.okaRouter = new Router({ prefix: "/shortcuts" });

		this.router.post("/:id/run", async (ctx) => {
			const id = ctx.params.id;
			const shortcut = shortcutsManager.shortcuts[id];

			if (shortcut === undefined) {
				console.error(`[shortcuts] Unknown shortcut ${id}`);

				ctx.response.body = "Unknown shortcut";
				ctx.response.status = 400;
				return;
			}

			try {
				const command = new Deno.Command("/bin/bash", {
					args: ["-c", shortcut.cmd],
					stderr: "piped",
					stdout: "piped",
				});

				const output = await command.output();

				console.error(new TextDecoder().decode(output.stdout));
				console.error(new TextDecoder().decode(output.stderr));

				if (output.code !== 0) {
					throw new Error(`Failed to run shortcut ${shortcut.name}`);
				} else {
					console.log(`[shortcuts] Ran shortcut ${shortcut.name}`);
					ctx.response.body = "OK";
				}
			} catch (err) {
				ctx.response.body = "ERROR";
				ctx.response.status = 400;

				console.error(err);
			}
		});
	}
}

const shortcutsManager = new ShortcutsManager();

export default shortcutsManager;

class Shortcut {
	name: string;
	icon: string;
	cmd: string;

	id: string; // For internal tracking

	constructor(name: string, icon: string, cmd: string) {
		this.name = name;
		this.icon = icon;
		this.cmd = cmd;

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
					secondary: "#161840",
					primary: "#474bc4",
					icon: "#ffffff",
				},
			},
			click: {
				type: "api",
				endpoint: `/shortcuts/${this.id}/run`,
			},
			module: "Shortcuts",

			group: group,
		};
	}
}

class Group {
	name: string;
	entries: Shortcut[] = [];

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

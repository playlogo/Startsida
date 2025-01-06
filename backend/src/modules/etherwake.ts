/*
	Add devices to wake via Wake-On-Lan
*/

import { Router } from "https://deno.land/x/oak@v17.1.3/mod.ts";

import { Entry, Module } from "local/src/common.ts";
import { loadConfig } from "local/src/utils.ts";

class WakeOnLanManager extends Module {
	configSchemaVersion = 1;
	config: { [key: string]: { [key: string]: { icon: string; mac: string } } } = {};

	groups: Group[] = [];

	override icon = {
		name: "WakeOnLan",
		icon: "icon-park-outline:ethernet-on",
		colors: {
			background: "white",
			icon: "black",
		},
	};

	override async collect() {
		// TODO- check if /usr/bin/wakeonlan exists

		// Load config
		this.config = await loadConfig("wol", this.configSchemaVersion);

		// Parse config
		this.parseConfig();
	}

	parseConfig() {
		for (const [key, value] of Object.entries(this.config)) {
			if (key === "$schema" || key === "version") {
				continue;
			}

			const group = new Group(key);
			for (const [deviceName, deviceConfig] of Object.entries(value)) {
				const device = new Device(deviceName, deviceConfig.icon, deviceConfig.mac);
				group.entries.push(device);
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
		this.okaRouter = new Router({ prefix: "/wol" });

		this.router.post("/:mac/wake", async (ctx) => {
			const mac = ctx.params.mac.replaceAll("_", ":");

			console.log(`[wol] Waking device ${mac}`);

			try {
				const command = new Deno.Command("/usr/bin/awake", {
					args: [mac],
				});

				const output = await command.output();

				if (output.code !== 0) {
					console.error("[wol]" + new TextDecoder().decode(output.stdout));
					console.error("[wol]" + new TextDecoder().decode(output.stderr));

					throw new Error(`Failed to wake device ${mac}`);
				} else {
					console.log(`[wol] Woke device ${mac}`);

					ctx.response.body = "OK";
				}
			} catch (err: any) {
				ctx.response.body = `ERROR: ${err.message}`;
				ctx.response.status = 400;

				console.error(err);
			}
		});
	}
}

const wakeOnLanManager = new WakeOnLanManager();

export default wakeOnLanManager;

class Device {
	name: string;
	icon: string;
	mac: string;

	id: string; // For internal tracking

	constructor(name: string, icon: string, mac: string) {
		this.name = name;
		this.icon = icon;
		this.mac = mac;

		this.id = crypto.randomUUID();
	}

	common(group: string): Entry {
		return {
			id: this.id,
			name: this.name,
			icon: {
				type: "iconFull",
				icon: this.icon,
				colors: {
					background: "blue",
					icon: "black",
				},
			},
			click: {
				type: "api",
				endpoint: `/wol/${this.mac.replaceAll(":", "_")}/wake`,
			},
			module: "WakeOnLan",

			group: group,
		};
	}
}

class Group {
	name: string;
	entries: Device[] = [];

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

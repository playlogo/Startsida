import { Router } from "https://deno.land/x/oak@v17.1.3/mod.ts";

import { Entry } from "../common.ts";
import { loadConfig } from "../utils.ts";

import Module from "./_module.ts";

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
			name: name,
			icon: {
				type: "icon",
				icon: this.icon,
				background: "blue",
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

class WakeOnLanManager extends Module {
	configSchemaVersion = 1;
	config: { [key: string]: { [key: string]: { icon: string; mac: string } } } = {};

	groups: Group[] = [];

	override async collect() {
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

				console.log(`[wol] Added device: ${device.name}`);
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

		this.router.get("/:mac/wake", async (ctx) => {
			const mac = ctx.params.mac.replaceAll("_", ":");

			try {
				const command = new Deno.Command("/usr/bin/wakeonlan", {
					args: [mac],
				});

				const output = await command.output();

				if (output.code !== 0) {
					console.error(new TextDecoder().decode(output.stdout));
					console.error(new TextDecoder().decode(output.stderr));

					throw new Error(`Failed to wake device ${mac}`);
				} else {
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

export default new WakeOnLanManager();

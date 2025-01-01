import { Entry } from "../common.ts";
import Module from "./_module.ts";
import { loadConfig } from "../utils.ts";

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

	common(): Entry {
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
		};
	}
}

class WakeOnLanManager extends Module {
	configSchemaVersion = 1;
	config: { [key: string]: { icon: string; mac: string } } = {};

	devices: Device[] = [];

	override async collect() {
		// Load config
		this.config = await loadConfig("bookmarks", this.configSchemaVersion);

		// Parse config
		this.parseConfig();
	}

	parseConfig() {
		for (const [key, value] of Object.entries(this.config)) {
			if (key === "$schema" || key === "version") {
				continue;
			}

			const device = new Device(key, value.icon, value.mac);
			this.devices.push(device);

			console.log(`[wol] Added device: ${device.name}`);
		}
	}

	override entries(): Entry[] {
		const res = [];

		for (const device of this.devices) {
			res.push(device.common());
		}

		return res;
	}

	override buildRouter(): void {}
}

export default new WakeOnLanManager();

import { Application, Router } from "https://deno.land/x/oak@v17.1.3/mod.ts";
import { Entry, Module, ModuleIcon } from "local/src/common.ts";

class ModuleManager {
	modules: { [key: string]: Module } = {};

	async collect() {
		// Load all modules in 'modules' folder
		for await (const entry of Deno.readDir(`./src/modules`)) {
			let path = `./modules`;

			if (entry.isFile) {
				path += `/${entry.name}`;
			} else if (entry.isDirectory) {
				path += `/${entry.name}/index.ts`;
			}

			// Try to load module
			try {
				const exported = (await import(path).then((x) => x.default)) as Module;

				await exported.collect();

				this.modules[entry.name.replaceAll(".ts", "").replaceAll(".js", "")] = exported;
				console.log(`[modules] Loaded module '${entry.name}'`);
			} catch (err) {
				console.error(`[modules] Failed to load module '${path}'`);
				console.error(err);
				continue;
			}
		}

		console.log(`[modules] Loaded ${Object.keys(this.modules).length} modules`);
	}

	routes(app: Application) {
		const router = new Router();

		// API
		router.get("/entries", (ctx) => {
			const res: { entries: Entry[]; modules: { [key: string]: ModuleIcon } } = {
				entries: [],
				modules: {},
			};

			for (const [_name, module] of Object.entries(moduleManager.modules)) {
				res.entries.push(...module.entries());

				if (module.icon) {
					res.modules[module.icon.name] = module.icon;
				}
			}

			ctx.response.body = res;
		});

		router.get("/ping", (ctx) => {
			ctx.response.body = "pong";
		});

		app.use(router.routes());
		app.use(router.allowedMethods());

		// Add modules
		for (const module of Object.values(this.modules)) {
			app.use(module.router.routes());
			app.use(module.router.allowedMethods());
		}
	}
}

const moduleManager = new ModuleManager();

export default moduleManager;

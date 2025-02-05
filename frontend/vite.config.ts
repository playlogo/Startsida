import { execSync } from "child_process";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

import { viteSingleFile } from "vite-plugin-singlefile";

import * as fs from "fs";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		svelte(),
		viteSingleFile({
			inlinePattern: ["*.css"],
		}),
		{
			name: "inject-git-info",
			writeBundle(_, _bundle) {
				const commitHash = execSync("git rev-parse --short HEAD").toString().trim();
				const commitCount = execSync("git rev-list --count HEAD").toString().trim();

				const manifestPath = "./dist/.vite/manifest.json";
				const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

				manifest.gitInfo = {
					commitHash,
					commitCount,
				};

				fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
			},
		},
	],
	build: {
		manifest: true,
	},
});

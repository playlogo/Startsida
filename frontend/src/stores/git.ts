import { writable } from "svelte/store";
import type { GitInfo } from "../types/sw";

function buildStore() {
	// Store
	const { subscribe, set, update } = writable<{
		info: GitInfo;
		isLoading: boolean;
		error?: string;
	}>(
		{
			info: {
				commitCount: "",
				commitHash: "",
			},
			isLoading: true,
		},
		function start() {
			// Start loading
			fetch(`/gitInfo`)
				.then((res) => res.json())
				.then((json) => {
					if (json["commitHash"] === undefined) {
						throw new Error("Error getting git version in service worker");
					}

					set({
						info: json,
						isLoading: false,
						error: undefined,
					});
				})
				.catch((err) => {
					let errorMessage = "Service worker unavailable";

					if (!(err instanceof SyntaxError)) {
						console.error(`Failed to fetch git info, try again later`);
						console.error(err);
					}

					set({
						info: {
							commitCount: "",
							commitHash: "",
						},
						isLoading: false,
						error: errorMessage,
					});
				});
		}
	);

	const store = {
		subscribe,
	};

	return store;
}

export default buildStore();

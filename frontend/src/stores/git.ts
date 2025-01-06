import { writable } from "svelte/store";
import type { GitInfo } from "../types/sw";

function buildStore() {
	// Store
	const { subscribe, set, update } = writable<{
		info: GitInfo;
		isLoading: boolean;
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
					set({
						info: json,
						isLoading: false,
					});
				})
				.catch((err) => {
					console.error(`Failed to fetch git info, try again later`);
					console.error(err);
				});
		}
	);

	const store = {
		subscribe,
	};

	return store;
}

export default buildStore();

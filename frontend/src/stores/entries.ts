import { writable } from "svelte/store";
import type { ModuleIcon, Entry } from "../types/api";

function buildStore() {
	// Store
	const { subscribe, set, update } = writable<{
		entries: Entry[];
		modules: { [key: string]: ModuleIcon };
		isLoading: boolean;
	}>(
		{
			entries: [],
			modules: {},
			isLoading: true,
		},
		function start() {
			// Start loading
			fetch(`${window.api}/entries`)
				.then((res) => res.json())
				.then((json) => {
					set({
						entries: json.entries,
						modules: json.modules,
						isLoading: false,
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

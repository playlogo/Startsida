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
			(async () => {
				const res = await fetch(`${window.api}/entries`);
				const entries: { entries: Entry[]; modules: any } = await res.json();

				set({
					entries: entries.entries,
					modules: entries.modules,
					isLoading: false,
				});
			})();
		}
	);

	const store = {
		subscribe,
	};

	return store;
}

export default buildStore();

import { writable } from "svelte/store";
import type { Entry } from "../common";

function buildStore() {
	// Store
	const { subscribe, set, update } = writable<{
		entries: Entry[];
		isLoading: boolean;
	}>({
		entries: [],
		isLoading: true,
	});

	// Start loading
	fetch(`${window.api}/entries`)
		.then((res) => res.json())
		.then((entries) => {
			set({
				entries: entries,
				isLoading: false,
			});
		});

	const store = {
		subscribe,
	};

	return store;
}

export default buildStore();

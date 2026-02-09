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

	async function invalidate() {
		console.log("Force invalidating service worker");

		set({
			error: "Deleting Service worker",
			isLoading: false,
			info: {
				commitCount: "",
				commitHash: "",
			},
		});

		for (const key of await caches.keys()) {
			await caches.delete(key);
			console.log("Deleted cache " + key);
		}

		const reg = await navigator.serviceWorker.getRegistration();
		if (await reg?.unregister()) {
			console.log("Unregistered service worker");

			set({
				error: "Deleted Service worker - reloading in 3 sec",
				isLoading: false,
				info: {
					commitCount: "",
					commitHash: "",
				},
			});

			setTimeout(async () => {
				window.location.reload();
			}, 3000);
		} else {
			console.log("Error unregistering service worker");
		}
	}

	const store = {
		subscribe,
		invalidate,
	};

	return store;
}

export default buildStore();

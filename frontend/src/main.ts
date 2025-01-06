import "./app.css";

// API endpoint
declare global {
	interface Window {
		api: string;
	}
}

if (import.meta.env.DEV) {
	window.api = "http://192.168.178.61:8000";
} else {
	window.api = "";
}

// Load service worker
const registerServiceWorker = async () => {
	if (!("serviceWorker" in navigator)) {
		console.log("[main] Service workers are not supported. Will not support offline use");
		return;
	}

	try {
		const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

		if (registration.installing) {
			console.error("[main] Service worker stuck in installing");
		} else if (registration.waiting) {
			console.log("[main] Service worker successfully installed");
		} else if (registration.active) {
			console.log("[main] Service worker already active");
		}
	} catch (err) {
		console.error("[main] Service worker registration failed.", err);
	}
};

registerServiceWorker();

// Load app
//const App = (await import("./App.svelte")).default;
import App from "./App.svelte";

import { mount } from "svelte";

const app = mount(App, {
	target: document.getElementById("app")!,
});

export default app;

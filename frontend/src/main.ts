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

// Load app
//const App = (await import("./App.svelte")).default;
import App from "./App.svelte";

import { mount } from "svelte";

const app = mount(App, {
	target: document.getElementById("app")!,
});

export default app;

import "./app.css";

// API endpoint
declare global {
	interface Window {
		api: string;
	}
}

window.api = "http://192.168.178.61:8000";

// Load app
const App = (await import("./App.svelte")).default;
import { mount } from "svelte";

const app = mount(App, {
	target: document.getElementById("app")!,
});

export default app;

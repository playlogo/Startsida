import cache from "./storage.ts";
import moduleManager from "local/src/modules.ts";
import app from "local/src/api.ts";

// Load cache
await cache.init();

// Collect modules
await moduleManager.collect();
moduleManager.routes(app);

// Start serving
app.addEventListener("listen", ({ hostname, port, secure }) => {
	console.log(`[main] Listening on: ${secure ? "https://" : "http://"}${hostname ?? "localhost"}:${port}`);
});

await app.listen({ port: 8000 });

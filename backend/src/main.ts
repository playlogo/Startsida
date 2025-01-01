// Load cache
import cache from "./cache.ts";

await cache.init();

// Ethernet wake
import wakeOnLanManager from "./modules/etherwake.ts";

try {
	await wakeOnLanManager.collect();
} catch (_) {
	console.error(`[main] Unable to load Wake-on-lan`);
}

// Collect bookmarks, icons, etc
import bookmarksManager from "./modules/bookmarks/manager.ts";

try {
	await bookmarksManager.collect();
} catch (err) {
	console.error(`[main] Unable to collect bookmarks, quitting`);
	console.error(err);

	Deno.exit(1);
}

// API
import { Application, send } from "https://deno.land/x/oak@v17.1.3/mod.ts";

const app = new Application();

// Serve static
app.use(async (ctx, next) => {
	try {
		await send(ctx, ctx.request.url.pathname, {
			root: "dist/",
			index: "index.html",
		});
	} catch (_) {
		await next();
	}
});

// Routes
app.use(bookmarksManager.router.routes());
app.use(bookmarksManager.router.allowedMethods());

app.use(wakeOnLanManager.router.routes());
app.use(wakeOnLanManager.router.allowedMethods());

// Start api
app.addEventListener("listen", ({ hostname, port, secure }) => {
	console.log(`[api] Listening on: ${secure ? "https://" : "http://"}${hostname ?? "localhost"}:${port}`);
});

await app.listen({ port: 8000 });

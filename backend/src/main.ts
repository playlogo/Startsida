import { Application, Router, send } from "https://deno.land/x/oak@v17.1.3/mod.ts";

const app = new Application();

// Server static
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
const router = new Router();

router.get("/", (ctx, next) => {
	ctx.response.body = "hello world";
	return next();
});

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("listen", ({ hostname, port, secure }) => {
	console.log(`[api] Listening on: ${secure ? "https://" : "http://"}${hostname ?? "localhost"}:${port}`);
});

await app.listen({ port: 8000 });

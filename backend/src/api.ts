import { Application, send } from "https://deno.land/x/oak@v17.1.3/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

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
app.use(oakCors());

export default app;

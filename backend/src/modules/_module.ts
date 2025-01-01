import { Router } from "https://deno.land/x/oak@v17.1.3/mod.ts";
import { Entry } from "../common.ts";

export default class Module {
	okaRouter: Router | undefined = undefined;

	async collect() {}

	entries(): Entry[] {
		return [];
	}

	/* Rest */
	buildRouter() {}

	get router(): Router {
		if (this.okaRouter === undefined) {
			this.buildRouter();
		}

		return this.okaRouter!;
	}
}

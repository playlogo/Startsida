export interface ImageIcon {
	type: "image";
	url: string;
}

export interface IconIconFull {
	type: "iconFull";
	icon: string;
	background: string;
}

export interface IconIconGradient {
	type: "iconGradient";
	icon: string;
	from: string;
	to: string;
}

export interface HrefClick {
	type: "href";
	url: string;
}

export interface APIClick {
	type: "api";
	endpoint: string;
}

export interface Entry {
	id: string;

	name: string;
	icon: ImageIcon | IconIconFull | IconIconGradient;

	group: string;

	click: HrefClick | APIClick;
	module: string;
}

import { Router } from "https://deno.land/x/oak@v17.1.3/mod.ts";

export class Module {
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

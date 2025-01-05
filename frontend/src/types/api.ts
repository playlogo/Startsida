export interface ImageIcon {
	type: "image";
	url: string;
}

export interface IconIconFull {
	type: "iconFull";
	icon: string;

	colors: {
		background: string;
		icon: string;
	};
}

export interface IconIconGradient {
	type: "iconGradient";
	icon: string;

	colors: {
		icon: string;
		primary: string;
		secondary: string;
	};
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

export interface ModuleIcon {
	name: string;

	icon: string;

	colors: {
		background: string;
		icon: string;
	};
}

export interface ImageIcon {
	type: "image";
	url: string;
}

export interface IconIcon {
	type: "icon";
	icon: string;
	background: string;
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
	icon: ImageIcon | IconIcon;

	group: string;

	click: HrefClick | APIClick;
	module: string;
}

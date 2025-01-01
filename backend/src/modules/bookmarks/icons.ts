import { DOMParser } from "jsr:@b-fuze/deno-dom";

const TIMEOUT = 2000;

export async function gatherIconURL(reqUrl: string, name: string) {
	let resUrl;
	let doc;

	try {
		const res = await fetch(reqUrl, { signal: AbortSignal.timeout(TIMEOUT) });
		resUrl = res.url;

		// Parse dom
		const page = await res.text();
		doc = new DOMParser().parseFromString(page, "text/html");
	} catch (_err) {
		console.error(`[bookmarks] [icon] Unable to fetch '${name}' '${reqUrl}'`);
		return "https://wikimedia.org/static/images/project-logos/enwiki.png";
	}

	// Try apple touch icon absolute path
	try {
		let appleTouchIcon = `${doc.querySelector("link[rel='apple-touch-icon']")!.getAttribute("href")}`;

		const url = new URL(resUrl);

		if (appleTouchIcon.startsWith("/")) {
			appleTouchIcon = `${url.protocol}//${url.hostname}:${url.port}${appleTouchIcon}`;
		} else {
			appleTouchIcon = `${url.protocol}//${url.hostname}:${url.port}/${appleTouchIcon}`;
		}

		// Test it
		const res = await fetch(appleTouchIcon, { signal: AbortSignal.timeout(TIMEOUT) });

		if (res.status !== 200) {
			throw new Error("Invalid status code");
		}

		console.log(`[bookmarks] [icon] Found icon for '${name}' using apple-touch-icon : ${appleTouchIcon}`);

		return appleTouchIcon;
	} catch (_err) {
		// Empty
	}

	// Try apple touch icon relative path
	try {
		let appleTouchIcon = `${doc.querySelector("link[rel='apple-touch-icon']")!.getAttribute("href")}`;

		const url = new URL(resUrl);

		if (appleTouchIcon.startsWith("/")) {
			appleTouchIcon = `${url.protocol}//${url.hostname}:${url.port}${url.pathname}${appleTouchIcon}`;
		} else {
			appleTouchIcon = `${url.protocol}//${url.hostname}:${url.port}${url.pathname}/${appleTouchIcon}`;
		}

		// Test it
		const res = await fetch(appleTouchIcon, { signal: AbortSignal.timeout(TIMEOUT) });

		if (res.status !== 200) {
			throw new Error("Invalid status code");
		}

		console.log(`[bookmarks] [icon] Found icon for '${name}' using apple-touch-icon : ${appleTouchIcon}`);

		return appleTouchIcon;
	} catch (_err) {
		// Empty
	}

	// Try open graph
	try {
		let openGraphImage = `${doc.querySelector("meta[property='og:image']")!.getAttribute("content")}`;

		if (openGraphImage.startsWith("/")) {
			const url = new URL(resUrl);
			openGraphImage = `${url.protocol}//${url.hostname}:${url.port}${openGraphImage}`;
		} else {
			openGraphImage = `${resUrl}${openGraphImage}`;
		}

		// Test it
		const res = await fetch(openGraphImage, { signal: AbortSignal.timeout(TIMEOUT) });

		if (res.status !== 200) {
			throw new Error("Invalid status code");
		}

		console.log(`[bookmarks] [icon] Found icon for '${name}' using open-graph : ${openGraphImage}`);

		return openGraphImage;
	} catch (_err) {
		// Empty
	}

	// Try to get favicon
	try {
		let faviconImage = `${doc.querySelector("link[rel='icon']")!.getAttribute("href")}`;

		if (faviconImage.startsWith("/")) {
			const url = new URL(resUrl);
			faviconImage = `${url.protocol}//${url.hostname}:${url.port}${faviconImage}`;
		} else {
			faviconImage = `${resUrl}${faviconImage}`;
		}

		// Test it
		const res = await fetch(faviconImage, { signal: AbortSignal.timeout(TIMEOUT) });

		if (res.status !== 200) {
			throw new Error("Invalid status code");
		}

		console.log(`[bookmarks] [icon] Found icon for '${name}' using favicon : ${faviconImage}`);

		return faviconImage;
	} catch (_err) {
		// Empty
	}

	console.error(`[bookmarks] [icon] Unable to find icon for '${name}' '${reqUrl}'`);
	return "https://wikimedia.org/static/images/project-logos/enwiki.png";
}

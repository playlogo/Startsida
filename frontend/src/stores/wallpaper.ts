import { updateThemeColor } from "../utils/theme-color";

import { writable } from "svelte/store";

function buildStore() {
	// Store
	const { subscribe, set, update } = writable<{
		creator: string;
		image: string;
		platform: {
			name: string;
			url: string;
		};
		link: string;
		isLoading: boolean;
	}>(
		{
			creator: "",
			platform: {
				name: "",
				url: "",
			},
			image: "",
			link: "",
			isLoading: true,
		},
		function start() {
			(async () => {
				const papers = (await (await fetch(`${window.api}/wallpapers/`)).json()) as string[];

				const dailyPaper = papers[(new Date().getDate() + 2) % papers.length];

				// Try to extract image credit from filename
				let imageCredit = {
					platform: {
						name: "Unknown",
						url: "#",
					},
					creator: "Unknown",
					link: "#",
				};

				// Check if image is from unsplash
				const unsplash_regex = /^([a-zA-Z-]+)-([_a-zA-Z0-9-]{11})-unsplash\.jpg$/;
				const unsplash_match = dailyPaper.match(unsplash_regex);

				if (unsplash_match) {
					// From unsplash!
					const [_, creator, id] = unsplash_match;
					imageCredit = {
						creator: creator
							.replace("-", " ")
							.split(" ")
							.map((entry) => entry[0].toUpperCase() + entry.slice(1))
							.join(" "),
						link: `https://unsplash.com/photos/${id}`,
						platform: {
							name: "Unsplash",
							url: "https://unsplash.com/",
						},
					};
				}

				set({
					isLoading: false,
					image: dailyPaper,
					platform: imageCredit.platform,
					link: imageCredit.link,
					creator: imageCredit.creator,
				});

				// Get right image size for screen
				const imageSizes = {
					1920: "1920:1080",
					2560: "2560:1440",
					3840: "3840:2160",
				};

				const requiredHeight = Math.max(window.innerWidth, window.innerHeight);
				let imageSize = imageSizes[3840];

				for (const entry of Object.entries(imageSizes)) {
					if (parseInt(entry[0]) < requiredHeight) {
						continue;
					}

					imageSize = entry[1];
					break;
				}

				const wallpaperUrl = `${window.location.protocol}//${window.location.hostname}:${
					parseInt(window.location.port) + 2
				}/insecure/rs:fill:${imageSize}/plain/wallpapers/${dailyPaper}@webp`; //`${window.api}/wallpapers/${dailyPaper}`;

				// Apply image
				document.querySelector("html")!.style.backgroundImage = `url("${wallpaperUrl}")`;

				// Add fade in effect
				const appElement = document.querySelector("#app")! as HTMLElement;
				let preloaderImg = document.createElement("img");

				preloaderImg.src = wallpaperUrl;

				preloaderImg.addEventListener("load", async (event) => {
					appElement.style.backgroundColor = "#1a1a1e00";
					// @ts-expect-error cannot assign null to HTMLElement
					preloaderImg = null;
				});

				// Setoff theme color change
				updateThemeColor(wallpaperUrl);
			})();
		}
	);

	const store = {
		subscribe,
	};

	return store;
}

export default buildStore();

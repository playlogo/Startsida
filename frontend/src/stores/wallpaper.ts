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

				if (dailyPaper.split(".")[0].endsWith("unsplash")) {
					// Extract creator and give attribution
					set({
						isLoading: false,
						image: dailyPaper,
						platform: {
							name: "Unsplash",
							url: "https://unsplash.com/",
						},
						link: `https://unsplash.com/photos/${dailyPaper.split("-").slice(-2)[0]}`,
						creator: dailyPaper
							.split("-")
							.slice(0, -3)
							.map((entry) => entry[0].toUpperCase() + entry.slice(1))
							.join(" "),
					});
				}

				// Change body background
				document.querySelector(
					"html"
				)!.style.backgroundImage = `url("${window.api}/wallpapers/${dailyPaper}")`;

				// Setoff theme color change
				updateThemeColor(`${window.api}/wallpapers/${dailyPaper}`);
			})();
		}
	);

	const store = {
		subscribe,
	};

	return store;
}

export default buildStore();

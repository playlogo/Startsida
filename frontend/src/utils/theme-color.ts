const EVERY_N_PIXEL = 5;

export async function updateThemeColor(imageUrl: string) {
	// Try to read from localstorage
	let storedImages: { [key: string]: string } = {};

	if (localStorage.getItem("accentColors") !== null) {
		storedImages = JSON.parse(localStorage.getItem("accentColors")!);
	}

	if (storedImages[imageUrl] !== undefined) {
		document.querySelector("meta[name='theme-color']")!.setAttribute("content", storedImages[imageUrl]);
		document.querySelector(
			"html"
		)!.style.background = `url('${imageUrl}') center center / cover no-repeat padding-box border-box fixed ${storedImages[imageUrl]};`;

		return;
	}

	// Create image
	const image = document.createElement("img");

	await new Promise<void>((resolve, _reject) => {
		image.src = imageUrl;
		image.onload = (ele) => {
			resolve();
		};
	});

	// Create canvas
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d")!;

	const height = (canvas.height = image.naturalHeight);
	const width = (canvas.width = image.naturalWidth);

	// Draw image
	ctx.drawImage(image, 0, 0);

	const imageData = ctx.getImageData(0, 0, width, height);

	const color = { r: 0, g: 0, b: 0 };

	let i = 0;
	let count = 0;

	while ((i += EVERY_N_PIXEL * 4) < width) {
		++count;
		color.r += imageData.data[i];
		color.g += imageData.data[i + 1];
		color.b += imageData.data[i + 2];
	}

	color.r = ~~(color.r / count);
	color.g = ~~(color.g / count);
	color.b = ~~(color.b / count);

	// Convert to hex
	const hex = rgbToHex(color.r, color.g, color.b);

	console.log(`[theme-color] Extracted color '${hex}' for '${imageUrl}'`);

	// Apply
	document.querySelector("meta[name='theme-color']")!.setAttribute("content", hex);
	document.querySelector(
		"html"
	)!.style.background = `url('${imageUrl}') center center / cover no-repeat padding-box border-box fixed ${storedImages[imageUrl]};`;

	// Store in localstorage
	storedImages[imageUrl] = hex;
	localStorage.setItem("accentColors", JSON.stringify(storedImages));
}
function componentToHex(c: number) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r: number, g: number, b: number) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

<script lang="ts">
	import Icon from "@iconify/svelte";

	import entries from "../stores/entries";

	import type { Entry, ImageIcon } from "../types/api";
	import { rgbToHex } from "../utils/theme-color";

	let { data, searchString }: { data: Entry; searchString: string } = $props();

	// Consts
	const MIN_REQUEST_DURATION = 1000;
	const FALLBACK_IMAGE_BACKGROUND_COLOR = "white";
	const IMAGE_SCALE_FACTOR_TARGET = 0.9;

	const Status = {
		NONE: "NONE",
		OK: "OK",
		ERROR: "ERROR",
	};

	// API action
	let loading: boolean = $state(false);
	let status: string = $state(Status.NONE);

	let statusClearTimeout: NodeJS.Timeout;
	let requestStart = 0;

	async function click(_event: MouseEvent) {
		if (data.click.type === "href") {
			// Navigate to webpage
			return;
		}

		if (data.click.type === "api") {
			if (loading) {
				return;
			}

			if (statusClearTimeout !== undefined) {
				clearTimeout(statusClearTimeout);
			}

			// Request api resource
			loading = true;

			requestStart = Date.now();

			let res;

			try {
				res = await fetch(`${window.api}${data.click.endpoint}`, {
					signal: AbortSignal.timeout(10000),
					method: "POST",
				});
			} catch (err) {
				console.error(err);
			} finally {
				// Minimum loading duration
				if (Date.now() - requestStart < MIN_REQUEST_DURATION) {
					await new Promise<void>((resolve, _reject) => {
						setTimeout(
							() => {
								resolve();
							},
							MIN_REQUEST_DURATION - (Date.now() - requestStart)
						);
					});
				}

				if (!res) {
					return;
				}
			}

			// Handle response
			loading = false;

			// TODO: Improve visuals for status
			//status = res.ok ? Status.OK : Status.ERROR;

			// Clear status overlay
			statusClearTimeout = setTimeout(() => {
				status = Status.NONE;
			}, 5000);

			// Logging
			if (!res.ok) {
				const text = await res.text();

				console.error(res.statusText);
				console.error(text);
			}
		}
	}

	// Background color
	let properties = $state<ImageProperties>({
		backgroundColor: FALLBACK_IMAGE_BACKGROUND_COLOR,
		size: {
			scaleFactor: 0,
			real: {
				width: 0,
				height: 0,
			},
			dimensions: {
				width: 0,
				height: 0,
			},
		},
		transparent: false,
	});

	interface ImageProperties {
		backgroundColor: string;

		size: {
			scaleFactor: number;
			real: {
				width: number;
				height: number;
			};
			dimensions: {
				width: number;
				height: number;
			};
		};

		transparent: boolean;
	}

	async function extractImageProperties(): Promise<ImageProperties> {
		const imageProperties: ImageProperties = {
			backgroundColor: FALLBACK_IMAGE_BACKGROUND_COLOR,
			size: {
				scaleFactor: 0,
				real: {
					width: 0,
					height: 0,
				},
				dimensions: {
					width: 0,
					height: 0,
				},
			},
			transparent: false,
		};

		// Try to find data in cache
		const url = `/proxy/insecure/rs:fill:64:64/plain${(data.icon as ImageIcon).url}@webp`;

		if (localStorage.getItem("icon-data") !== null) {
			const parsed = JSON.parse(localStorage.getItem("icon-data")!);
			if (parsed[url] !== undefined) {
				const entry = parsed[url];

				// Check if legacy
				if (typeof entry === "string" || entry instanceof String) {
					// Update legacy
					localStorage.setItem("icon-data", JSON.stringify({}));
					window.location.reload();
				}

				return entry;
			}
		} else {
			localStorage.setItem("icon-data", JSON.stringify({}));
		}

		// Extract it from image
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d")!;

		// Load image
		const image = document.createElement("img");
		await new Promise<void>((resolve, _reject) => {
			image.src = `${window.api}${url}`;

			image.onload = (_element) => {
				resolve();
			};
		});

		// Draw image to a js canvas
		const height = (canvas.height = image.naturalHeight);
		const width = (canvas.width = image.naturalWidth);

		ctx.drawImage(image, 0, 0);
		let imageData;

		try {
			imageData = ctx.getImageData(0, 0, width, height);
		} catch (err) {
			console.warn(`[icon] Cannot extract background from image '${window.api}${url}' due to CORS`);
			return imageProperties;
		}

		// Extract real image size (ignoring white/transparent borders)
		let content_minX = image.width,
			content_maxX = 0,
			content_minY = image.height,
			content_maxY = 0;

		for (let y = 0; y < image.height; y++) {
			for (let x = 0; x < image.width; x++) {
				let index = (y * image.width + x) * 4;
				let alpha = imageData.data[index + 3]; // Alpha channel

				// Check if image has transparency
				if (alpha === 0) {
					imageProperties.transparent = true;
				}

				if (
					alpha > 0 &&
					imageData.data[index] !== 255 &&
					imageData.data[index + 1] !== 255 &&
					imageData.data[index + 2] !== 255
				) {
					// Pixel is not transparent
					content_minX = Math.min(content_minX, x);
					content_maxX = Math.max(content_maxX, x);
					content_minY = Math.min(content_minY, y);
					content_maxY = Math.max(content_maxY, y);
				}
			}
		}

		imageProperties.size.real.width = content_maxX - content_minX + 1;
		imageProperties.size.real.height = content_maxY - content_minY + 1;

		imageProperties.size.dimensions.width = image.naturalWidth;
		imageProperties.size.dimensions.height = image.naturalHeight;

		// Compute image scale factor
		imageProperties.size.scaleFactor =
			Math.max(imageProperties.size.real.width, imageProperties.size.real.height) /
			Math.max(image.naturalWidth, image.naturalHeight);

		imageProperties.size.scaleFactor = Math.min(
			Math.max(75 + (IMAGE_SCALE_FACTOR_TARGET - imageProperties.size.scaleFactor) * 80, 60),
			85
		);

		// If image is not transparent, set background color to color of upper middle pixel
		if (!imageProperties.transparent) {
			const middle = (width / 2) * 4 - 4;
			imageProperties.backgroundColor = `${rgbToHex(imageData.data[middle], imageData.data[middle + 1], imageData.data[middle + 2])}`;
		}

		// Store results to cache
		const stored = JSON.parse(localStorage.getItem("icon-data")!);

		stored[url] = {
			backgroundColor: imageProperties.backgroundColor,
			size: imageProperties.size,
			transparent: imageProperties.transparent,
		};

		localStorage.setItem("icon-data", JSON.stringify(stored));

		return imageProperties;
	}

	if (data.icon.type === "image") {
		extractImageProperties().then((imageProperties) => (properties = imageProperties));
	}
</script>

<div
	class="container"
	class:searchHide={searchString.length != 0 &&
		!data.name.toLowerCase().includes(searchString.toLowerCase())}
>
	<a
		class="imageContainer"
		href={data.click.type !== "href" ? "#" : `${data.click.url}`}
		style={`background: ${data.icon.type === "iconFull" ? data.icon.colors.background : data.icon.type === "iconGradient" ? "linear-gradient(-45deg, " + data.icon.colors.primary + ", " + data.icon.colors.secondary + ")" : properties.backgroundColor}`}
		onclick={click}
		class:dimmed={loading || status !== Status.NONE}
		class:zoomed={loading}
		class:cursor_blocked={loading}
	>
		{#if data.icon.type === "image"}
			<img
				class="image"
				src={`/proxy/insecure/rs:fill:64:64/plain${data.icon.url}@webp`}
				alt={`${data.name} logo`}
				draggable="false"
				style={`width: ${properties.size.scaleFactor}%; height: ${properties.size.scaleFactor}%;`}
			/>
		{:else if data.icon.type === "iconFull" || data.icon.type === "iconGradient"}
			<Icon icon={data.icon.icon} width={32} color={data.icon.colors.icon} />
		{/if}

		<!-- Module Icon Overlay -->
		{#if $entries.modules[data.module] !== undefined}
			<div
				class="moduleOverlay"
				style={`background: ${$entries.modules[data.module].colors.background}`}
			>
				<Icon
					icon={$entries.modules[data.module].icon}
					width={16}
					color={$entries.modules[data.module].colors.icon}
				/>
			</div>
		{/if}

		<!-- Loading spinner -->
		{#if loading}
			<div class="loadingAnimation">
				<div class="spinner"></div>
			</div>
		{/if}

		<!-- Status overlay -->
		{#if status !== Status.NONE}
			<div class="status">
				<Icon
					icon={status === Status.OK
						? "fluent:checkmark-circle-12-regular"
						: "fluent:error-circle-12-regular"}
					width={32}
					color={status === Status.OK ? "#30da5a" : "#ff9e09"}
				/>
			</div>
		{/if}
	</a>

	<div class="text">
		<p>
			{@html searchString.length === 0 ||
			(searchString.length !== 0 && !data.name.toLowerCase().includes(searchString.toLowerCase()))
				? data.name
				: data.name
						.toLowerCase()
						.replaceAll(
							searchString.toLowerCase(),
							`<span class="searchHighlight">${searchString}</span>`
						)}
		</p>
	</div>
</div>

<style>
	/* Searching */
	.searchHide {
		opacity: 0.4;
		transition: opacity 0.2s;
	}

	:global(.searchHighlight) {
		background-color: #69ff6987;
	}

	/* Status overlay */
	.status {
		position: absolute;
		width: 100%;
		height: 100%;

		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Spinner */
	.loadingAnimation {
		position: absolute;

		--spinner-width: 6px;
		--spinner-color: #e2e2e2;

		border-radius: 50%;
		border-color: #2525257a;
		border-style: solid;
		border-width: var(--spinner-width);

		width: 28px;
		height: 28px;
	}

	.spinner {
		border-radius: 50%;

		width: 28px;
		height: 28px;

		top: -6px;
		left: -6px;

		position: relative;
		border-color: aqua;
		border-top: red;
		border-color: transparent transparent transparent var(--spinner-color);
		border-width: var(--spinner-width);
		border-style: solid;

		animation: spin 1.5s infinite linear;
	}

	.spinner:before,
	.spinner:after {
		content: "";
		width: var(--spinner-width);
		height: var(--spinner-width);
		border-radius: 50%;
		background: var(--spinner-color);
		position: absolute;
		left: -0.6px;
	}
	.spinner:before {
		top: -1.3px;
	}
	.spinner:after {
		bottom: -1.3px;
	}

	@keyframes spin {
		100% {
			transform: rotate(360deg);
		}
	}

	/* Icon */
	.container {
		display: flex;
		flex-direction: column;
		gap: 6px;

		width: 88px;
		height: 80px;
		align-items: center;
		position: relative;

		transition: 0.2s;
	}

	.zoomed {
		scale: 1.1;
	}

	.cursor_blocked {
		cursor: default;
		pointer-events: none;
	}

	.dimmed::before {
		background-color: rgba(0, 0, 0, 0.3) !important;
	}

	.moduleOverlay {
		position: absolute;
		display: flex;

		justify-content: center;
		align-items: center;

		padding: 4px;
		border-radius: 22.5%;

		bottom: -8px;
		right: -8px;
	}

	.imageContainer {
		background-color: white;
		display: flex;
		align-items: center;
		justify-content: center;

		width: 54px;
		height: 54px;
		border-radius: 22.5%;
		transition: 0.2s;
		position: relative;

		position: sticky;
	}

	.imageContainer::before {
		content: "";
		background-color: rgba(255, 255, 255, 0);
		width: 100%;
		height: 100%;
		position: absolute;
		border-radius: 22.5%;
		transition: 0.2s;
	}

	@media (hover: hover) and (pointer: fine) {
		.imageContainer:hover:before {
			background-color: rgba(255, 255, 255, 0.12);
		}

		.imageContainer:hover {
			scale: 1.1;
		}
	}

	.image {
		width: 75%;
		height: 75%;

		border-radius: 22.5%;

		user-select: none;
		-webkit-user-drag: none;
	}

	/* Text */
	.text {
		width: 100%;
		display: flex;
		justify-content: center;
		position: absolute;
		top: 60px;
	}

	.text > p {
		margin: 0;
		cursor: default;
		user-select: none;

		font-size: 14px;
		padding: 0;
		text-align: center;

		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;

		line-height: 18px;
	}
</style>

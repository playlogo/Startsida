<script lang="ts">
	import Icon from "@iconify/svelte";

	import entries from "../stores/entries";

	import type { Entry, ImageIcon } from "../types/api";
	import { rgbToHex } from "../utils/theme-color";

	let { data }: { data: Entry } = $props();

	// Consts
	const MIN_REQUEST_DURATION = 1000;
	const FALLBACK_IMAGE_BACKGROUND_COLOR = "white";

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
	let backgroundColor = $state(FALLBACK_IMAGE_BACKGROUND_COLOR);

	async function extractBackgroundColor() {
		// Try to find color in cache
		const url = (data.icon as ImageIcon).url;

		if (localStorage.getItem("icon-transparency") !== null) {
			const parsed = JSON.parse(localStorage.getItem("icon-transparency")!);
			if (parsed[url] !== undefined) {
				if (parsed[url] === "FALLBACK") {
					return FALLBACK_IMAGE_BACKGROUND_COLOR;
				} else {
					return parsed[url];
				}
			}
		} else {
			localStorage.setItem("icon-transparency", JSON.stringify({}));
		}

		// Else extract it now
		let isTransparent = false;
		let backgroundColor = FALLBACK_IMAGE_BACKGROUND_COLOR;

		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d")!;

		const image = document.createElement("img");
		await new Promise<void>((resolve, _reject) => {
			image.src = `${window.api}${url}`;

			image.onload = (ele) => {
				resolve();
			};
		});

		const height = (canvas.height = image.naturalHeight);
		const width = (canvas.width = image.naturalWidth);

		// Draw image
		ctx.drawImage(image, 0, 0);
		let imageData;

		try {
			imageData = ctx.getImageData(0, 0, width, height);
		} catch (err) {
			console.warn(`[icon] Cannot extract background from image '${window.api}${url}' due to CORS`);
			return FALLBACK_IMAGE_BACKGROUND_COLOR;
		}

		// Check if any pixel is transparent
		for (var i = 0; i < imageData.data.length; i += 4) {
			if (imageData.data[i + 3] < 255) {
				isTransparent = true;
				break;
			}
		}

		if (!isTransparent) {
			// Color of upper middle pixel
			const middle = (width / 2) * 4 - 4;
			backgroundColor = `${rgbToHex(imageData.data[middle], imageData.data[middle + 1], imageData.data[middle + 2])}`;
		}

		const stored = JSON.parse(localStorage.getItem("icon-transparency")!);

		stored[url] = isTransparent ? "FALLBACK" : backgroundColor;
		localStorage.setItem("icon-transparency", JSON.stringify(stored));

		return backgroundColor;
	}

	if (data.icon.type === "image") {
		extractBackgroundColor().then((color) => (backgroundColor = color));
	}
</script>

<div class="container">
	<a
		class="imageContainer"
		href={data.click.type !== "href" ? "#" : `${data.click.url}`}
		style={`background: ${data.icon.type === "iconFull" ? data.icon.colors.background : data.icon.type === "iconGradient" ? "linear-gradient(-45deg, " + data.icon.colors.primary + ", " + data.icon.colors.secondary + ")" : backgroundColor}`}
		onclick={click}
		class:dimmed={loading || status !== Status.NONE}
		class:zoomed={loading}
		class:cursor_blocked={loading}
	>
		{#if data.icon.type === "image"}
			<img
				class="image"
				src={`${window.api}${data.icon.url}`}
				alt={`${data.name} logo`}
				draggable="false"
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
		<p>{data.name}</p>
	</div>
</div>

<style>
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
		width: 80%;
		height: 80%;

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
		bottom: 0;
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
		-webkit-line-clamp: 1;
		line-clamp: 1;
		-webkit-box-orient: vertical;
	}
</style>

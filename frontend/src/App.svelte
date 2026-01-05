<script lang="ts">
	import Icon from "@iconify/svelte";
	import Entry from "./lib/Entry.svelte";

	import entries from "./stores/entries";
	import git from "./stores/git";
	import wallpaper from "./stores/wallpaper";
	import { DeviceType, platform } from "./platform";

	let main: HTMLElement;

	$effect(() => {
		$entries.entries;

		// Check if main overflows and enable scrolling if so
		if (main.clientHeight + 100 > window.innerHeight) {
			document.querySelector("html")!.style.overflowY = "auto";
			main.style.paddingBottom = "120px";
		}

		// Set body position to relative on mobile devices
		if ([DeviceType.Mobile].includes(platform)) {
			document.querySelector("body")!.style.position = "relative";
		}
	});

	let searchString = $state("");
	let searchLockedIn = $state(false);
	let searchOpeningLink = $state(false);

	async function onKeyDown(e: KeyboardEvent) {
		if (e.key.length === 1) {
			// Add character to search string
			searchString += e.key;
		} else {
			if (e.key === "Backspace") {
				// Remove last character
				if (searchString.length !== 0) {
					searchString = searchString.slice(0, searchString.length - 1);
				}
			} else if (e.key === "Delete") {
				// Clear search string
				searchString = "";
			} else if (e.key === "Enter") {
				if (searchString.length !== 0) {
					// See if we find only one
					if (!$entries.isLoading) {
						const found = $entries.entries.filter((entry) =>
							entry.name.toLowerCase().includes(searchString.toLowerCase())
						);
						if (found.length === 1) {
							if (found[0].click.type === "api") {
								// For api entries -> Send request Todo polish
								try {
									await fetch(`${window.api}${found[0].click.endpoint}`, {
										signal: AbortSignal.timeout(10000),
										method: "POST",
									});
								} catch (_err) {
									console.log(_err);
								}
							} else {
								// For links, open them
								document.location.href = found[0].click.url;
								searchOpeningLink = true; // Might be used for animations
							}
						}
					}
				} else {
					return;
				}
			}
		}

		if (!$entries.isLoading && searchString.length !== 0) {
			// If the search finds exactly one item, highlight it
			const found = $entries.entries.filter((entry) =>
				entry.name.toLowerCase().includes(searchString.toLowerCase())
			);

			if (found.length === 1) {
				searchLockedIn = true;
				return;
			}
		}

		if (searchLockedIn === true) {
			searchLockedIn = false;
		}
	}
</script>

<svelte:window on:keydown|preventDefault={onKeyDown} />

<main
	class:mobile={[DeviceType.Mobile].includes(platform)}
	class:tablet={[DeviceType.Tablet].includes(platform)}
	bind:this={main}
>
	{#if !$entries.isLoading}
		{#each $entries.entries as entry}
			<Entry data={entry} {searchString} {searchLockedIn} {searchOpeningLink} />
		{/each}
	{/if}
</main>

{#if !$wallpaper.isLoading}
	<div class="bottom-right bottom" class:bottom-right-mobile={[DeviceType.Mobile].includes(platform)}>
		Photo by <a href={$wallpaper.link}>{$wallpaper.creator}</a> on
		<a href={$wallpaper.platform.url}>{$wallpaper.platform.name}</a>
	</div>
{/if}

{#if searchString.length !== 0}
	<div class="top-right-search bottom">
		<span>{searchString}</span>
	</div>
{/if}

{#if !$git.isLoading}
	<div class="bottom-left bottom" class:bottom-left-mobile={[DeviceType.Mobile].includes(platform)}>
		{#if $git.error}
			<span>{$git.error}</span>
		{:else}
			<Icon icon={"ri:git-branch-line"} /><span>{$git.info.commitHash}</span>
		{/if}
	</div>
{/if}

<style>
	main {
		padding: 48px;

		display: grid;
		grid-template-columns: repeat(auto-fill, 88px);
		grid-gap: 24px 8px;
		justify-content: space-between;
	}

	main.mobile {
		padding: 12px;
		padding-top: 24px;

		justify-content: center;
	}

	main.tablet {
		padding: 24px;

		justify-content: center;
	}

	.bottom {
		background-color: #2e2e2e41;
		color: #ffffff73;
		padding: 4px;
		padding-left: 8px;
		padding-right: 8px;
		border-radius: 6px;

		font-size: 14px;

		display: flex;
		align-items: center;
		gap: 6px;
		justify-content: center;
	}

	.bottom-left {
		position: absolute;

		bottom: 8px;
		right: 8px;
	}

	.top-right-search {
		position: absolute;

		top: 8px;
		right: 8px;

		background-color: #69ff6987;
		color: white;
	}

	.bottom-right {
		position: absolute;
		bottom: 8px;
		left: 8px;
	}

	.bottom-right > a {
		color: #eeeeee7c;
	}

	/* Bottom small view */
	@media (max-width: 500px) {
		.bottom-right {
			left: 8px;
			right: unset !important;
		}

		.bottom-left {
			left: 8px;
			right: unset !important;
			bottom: 48px;
		}

		main {
			padding: 12px;
			padding-top: 24px;

			justify-content: center;

			padding-bottom: 128px;
		}
	}

	.bottom-right-mobile {
		left: 8px;
		right: unset !important;
	}

	.bottom-left-mobile {
		left: 8px;
		right: unset !important;
		bottom: 48px;
	}
</style>

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
</script>

<main
	class:mobile={[DeviceType.Mobile].includes(platform)}
	class:tablet={[DeviceType.Tablet].includes(platform)}
	bind:this={main}
>
	{#if !$entries.isLoading}
		{#each $entries.entries as entry}
			<Entry data={entry} />
		{/each}
	{/if}
</main>

{#if !$wallpaper.isLoading}
	<div class="bottom-right bottom" class:bottom-right-mobile={[DeviceType.Mobile].includes(platform)}>
		Photo by <a href={$wallpaper.link}>{$wallpaper.creator}</a> on
		<a href={$wallpaper.platform.url}>{$wallpaper.platform.name}</a>
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
		display: flex;
		flex-wrap: wrap;
		flex-direction: row; /* This makes items flow from right to left */
		gap: 8px;
		row-gap: 24px;

		padding: 48px;
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

	.bottom-right {
		position: absolute;
		bottom: 8px;
		left: 8px;
	}

	.bottom-right > a {
		color: #eeeeee7c;
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

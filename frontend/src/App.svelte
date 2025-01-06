<script lang="ts">
	import Icon from "@iconify/svelte";
	import Entry from "./lib/Entry.svelte";

	import entries from "./stores/entries";
	import git from "./stores/git";
	import wallpaper from "./stores/wallpaper";
</script>

<main>
	{#if !$entries.isLoading}
		{#each $entries.entries as entry}
			<Entry data={entry} />
		{/each}
	{/if}
</main>

{#if !$wallpaper.isLoading}
	<div class="bottom-right">
		Photo by <a href={$wallpaper.link}>{$wallpaper.creator}</a> on
		<a href={$wallpaper.platform.url}>{$wallpaper.platform.name}</a>
	</div>
{/if}
{#if !$git.isLoading}
	<div class="bottom-left">
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

	.bottom-left {
		position: absolute;
		bottom: 8px;
		right: 16px;

		display: flex;
		align-items: center;
		gap: 6px;
		justify-content: center;

		color: #eeeeee7c;
		font-size: 14px;
	}

	.bottom-right {
		position: absolute;
		bottom: 8px;
		left: 16px;

		display: flex;
		align-items: center;
		gap: 6px;
		justify-content: center;

		color: #eeeeee7c;
		font-size: 14px;
	}

	.bottom-right > a {
		color: #eeeeee7c;
	}
</style>

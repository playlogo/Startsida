<script lang="ts">
	import Icon from "./lib/Icon.svelte";

	import entries from "./stores/entries";
</script>

<main>
	{#if !$entries.isLoading}
		{#each $entries.entries as entry}
			<Icon data={entry} />
		{/each}
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-wrap: wrap;
		flex-direction: row; /* This makes items flow from right to left */
		gap: 8px;
		row-gap: 24px;

		padding: 48px;
	}
</style>

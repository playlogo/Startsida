<script lang="ts">
	import type { Entry } from "../common";

	export let data: Entry;

	function click(_event: MouseEvent) {
		if (data.click.type === "href") {
			return;
		}

		if (data.click.type === "api") {
			console.log("Fetching" + data.click.endpoint);
		}
	}
</script>

<div class="container">
	<a class="image" href={data.click.type !== "href" ? "#" : `${data.click.url}`} on:click={click}>
		{#if data.icon.type === "image"}
			<img src={`${window.api}${data.icon.url}`} alt={`${data.name} logo`} />
		{:else if data.icon.type === "icon"}
			<img src={data.icon.icon} alt={`${data.name} logo`} />
		{/if}
	</a>
	<div class="text">
		<p>{data.name}</p>
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		gap: 6px;

		width: 88px;
		height: 88px;
		align-items: center;
	}

	.image {
		background-color: black;
		display: flex;
		align-items: center;
		justify-content: center;

		width: 54px;
		height: 54px;
		overflow: hidden;
		border-radius: 22.5%;
		transition: 0.2s;
	}

	.image:hover {
		opacity: 0.8;
	}

	.image > img {
		width: 100%;
		height: 100%;
		background-color: white;

		border-radius: 22.5%;
	}

	.text {
		width: 100%;
		display: flex;
		justify-content: center;
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

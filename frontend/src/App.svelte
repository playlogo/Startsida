<script lang="ts">
	import Icon from "./lib/Icon.svelte";

	const grafana = {
		image: "https://ionos.tail8c10d2.ts.net:5801/apple-icon.png",
		link: "http://192.168.178.64:3000/?orgId=1",
		name: "Grafana",
	};

	const chat = {
		image: "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/4b/36/3d/4b363d2b-753f-f33c-8d6f-6475855d5404/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/230x0w.webp",
		link: "http://192.168.178.64:3000/?orgId=1",
		name: "Grafana",
	};
</script>

<main>
	<Icon data={grafana} />
	<Icon data={chat} />
</main>

<style>
	.logo {
		height: 6em;
		padding: 1.5em;
		will-change: filter;
		transition: filter 300ms;
	}
	.logo:hover {
		filter: drop-shadow(0 0 2em #646cffaa);
	}
	.logo.svelte:hover {
		filter: drop-shadow(0 0 2em #ff3e00aa);
	}
	.read-the-docs {
		color: #888;
	}
</style>

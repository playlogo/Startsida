<script lang="ts">
	export let data: {
		link: string;
		name: string;
		image: string;
	};
</script>

<div class="container">
	<a class="image" href={data.link}>
		<img src={data.image} alt={`${data.name} logo`} />
	</a>
	<div class="text">
		<p>{data.name}</p>
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.image {
		background-color: black;
		display: flex;
		align-items: center;
		justify-content: center;

		width: 64px;
		height: 64px;
		overflow: hidden;
		border-radius: 22.5%;
	}

	.image > img {
		width: 100%;
		height: 100%;
		background-color: white;

		border-radius: 22.5%;
	}

	.text {
	}

	.text > p {
		margin: 0;
		cursor: default;
		user-select: none;
	}
</style>

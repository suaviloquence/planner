<script lang="ts">
	let hide: boolean = true;
	export let inline: boolean = false;
</script>

<div
	class="hover"
	on:mouseenter={() => (hide = false)}
	on:mouseleave={() => (hide = true)}
	on:focus={() => (hide = false)}
	on:blur={() => (hide = true)}
	tabindex={4}
	class:inline
	role="tooltip"
>
	<slot />
	<div class="tooltip" class:hide>
		<slot name="tooltip" />
	</div>
</div>

<style>
	.inline {
		display: inline;
	}

	.hide {
		display: none;
	}

	.tooltip {
		position: absolute;
		padding: 8px;
		background-color: #8d8;
		width: min(80vw, 30em);
	}
</style>

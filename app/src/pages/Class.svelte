<script lang="ts">
	import { type Class } from "../models/class";
	import { api } from "../stores";

	export let department: string;
	export let number: string;

	let infoPromise: Promise<Class>;
	$: infoPromise = $api.getClass({ department, number });
</script>

{#await infoPromise}
	Loading {department} {number}
{:then info}
	<h1>
		<!-- use the canonical name when we have it. -->
		<span class="code">{info.code.department} {info.code.number}</span> - {info.name}
	</h1>

	<p class="description">{info.description}</p>
	<ul>
		<li><span class="label">Credits: </span>{info.units}</li>
		{#if info.geCode}
			<li><span class="label">General education: </span>{info.geCode}</li>
		{/if}
	</ul>
{/await}

<style>
	.code {
		font-weight: bold;
	}

	.label {
		font-weight: bold;
	}
</style>

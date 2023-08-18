<script lang="ts">
	import { Class } from "../models/class";
	import { api } from "../stores";

	export let department: string;
	export let number: string;
	let info: Class = null;
	$: $api.getClass({ department, number }).then((cls) => (info = cls));
</script>

<h1><span class="code">{department} {number}</span> - {info.name}</h1>
<p class="description">{info.description}</p>

<style>
	.code {
		font-weight: bold;
	}
</style>

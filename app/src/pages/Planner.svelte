<script lang="ts">
	import Hoverable from "../components/Hoverable.svelte";
	import Link from "../components/Link.svelte";
	import type { Planner } from "../models/planner";
	import { api } from "../stores";
	import Class from "./Class.svelte";

	export let planner: Promise<Planner> | null = null;

	$: if (!planner) {
		planner = $api.getPlanner();
	}
</script>

{#await planner}
	Loading planner...
{:then planner}
	<table>
		<thead>
			<th>Code</th>
			<th>Name</th>
			<th>Units</th>
		</thead>
		<tbody>
			{#each planner.terms as term}
				<h2>{term.type} {term.year}</h2>
				{#each term.classes as cls}
					<tr>
						<td>
							<Hoverable inline>
								<Link
									href="/class/{cls.code.department}/{cls.code
										.number}"
									>{cls.code.department}
									{cls.code.number}</Link
								>
								<div slot="tooltip">
									<Class
										department={cls.code.department}
										number={cls.code.number}
									/>
								</div>
							</Hoverable></td
						>
						<td>{cls.name}</td>
						<td>{cls.units}</td>
					</tr>
				{/each}
				<button>Add a class</button>
			{/each}
			<button>Add a term</button>
		</tbody>
	</table>
{/await}

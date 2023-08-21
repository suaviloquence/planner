<script lang="ts">
    import Hoverable from "../components/Hoverable.svelte";
    import Link from "../components/Link.svelte";
    import type { Planner } from "../models/planner";
    import { api } from "../stores";

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
                                <div slot="tooltip">hii!!! :3</div>
                            </Hoverable></td
                        >
                        <td>{cls.name}</td>
                        <td>{cls.units}</td>
                    </tr>
                {/each}
                <li><button>Add a class</button></li>
            {/each}
            <li><button>Add a term</button></li>
        </tbody>
    </table>
{/await}

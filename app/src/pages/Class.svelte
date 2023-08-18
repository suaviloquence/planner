<script lang="ts" context="module">
    export enum GeneralEducation {
        MF,
    };

    export interface ClassCode {
        department: string,
        number: string,
    };

    export interface Class {
        code: ClassCode,
        name: string,
        description: string,
        prerequisites?: ClassCode[],
        units: number,
        geCode?: GeneralEducation,
    };
</script>

<script lang="ts">
    import { api } from "../stores";

    export let department: string;
    export let number: string;
    let info: Class = null;
    $: $api.getClass({ department, number }).then(cls => info = cls);
</script>

<h1><span class="code">{department} {number}</span> - {info.name}</h1>
<p class="description">{info.description}</p>

<style>
    .code {
        font-weight: bold;
    }
</style>
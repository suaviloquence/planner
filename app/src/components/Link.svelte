<script lang="ts">
    import { path } from "../stores";

    export let href: string;

    function onClick(evt: Event) {
        evt.preventDefault();
        console.dir($path);
        $path = href;
    }
</script>

<a {href} on:click={onClick}><slot /></a>

<script lang="ts">
    let hide: boolean = true;
    export let inline: boolean = false;
</script>

<div
    class="hover"
    on:mouseenter={() => (hide = false)}
    on:mouseleave={() => (hide = true)}
    class:inline
>
    <slot />
</div>

<div class="tooltip" class:hide>
    <slot name="tooltip" />
</div>

<style>
    .inline {
        display: inline;
    }

    .hide {
        display: none;
    }
</style>

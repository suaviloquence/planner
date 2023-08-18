import sveltePlugin from "rollup-plugin-svelte";
import resolvePlugin from "@rollup/plugin-node-resolve"
import sveltePreprocess from "svelte-preprocess";
import typescriptPlugin from "@rollup/plugin-typescript";

export default {
    input: "./src/index.ts",
    output: {
        format: "iife",
        file: "bin/planner.js"
    },
    plugins: [
        sveltePlugin({
            preprocess: sveltePreprocess(),
            emitCss: false
        }),
        resolvePlugin({ browser: true }),
        typescriptPlugin(),
    ],
};
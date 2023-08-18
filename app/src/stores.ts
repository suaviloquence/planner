import { writable, type Readable, type Writable, readable } from "svelte/store";
import { Api } from "./api";

export const path: Writable<string> = writable(window.location.pathname)
// TODO initialize API elsewhere
export const api: Readable<Api> = readable(new Api());
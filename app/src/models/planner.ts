import type { Class } from "./class";

export interface Planner {
    terms: Term[],
};

export enum TermType {
    Winter,
    Spring,
    // TODO: summer1, summer2?
    Summer,
    Fall
}

export interface Term {
    type: TermType,
    year: number,
    classes: Class[],
};
import type { Class } from "./class";

export interface Planner {
	terms: Term[],
};

export enum TermType {
	Winter = "Winter",
	Spring = "Spring",
	// TODO: summer1, summer2?
	Summer = "Summer",
	Fall = "Fall",
}

export interface Term {
	type: TermType,
	year: number,
	classes: Class[],
};
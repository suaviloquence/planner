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
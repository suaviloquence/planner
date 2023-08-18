import { GeneralEducation, type Class, type ClassCode } from "./models/class";

const _classes: Record<string, Record<string, Class>> = {
	"CSE": {
		"20": {
			code: { department: "CSE", number: "20" },
			name: "Beginning Programming in Python",
			description: " Provides students with Python programming skills and the ability to design programs and read Python code. Topics include data types, control flow, methods and advanced functions, built-in data structures, and introduction to OOP. No prior programming experience is required. Students may not receive credit for CSE 20 after receiving credit for CSE 30. Students with prior programming experience (especially in Python) are encouraged to take CSE Testout Exam to be evaluated for their readiness to take CSE 30 directly: https://undergrad.soe.ucsc.edu/cse-20-testout-exam.",
			units: 5,
			geCode: GeneralEducation.MF,
		}
	}
};

export class Api {
	constructor() {

	}

	async getClass(classCode: ClassCode): Promise<Class | null> {
		return Promise.resolve(_classes[classCode.department][classCode.number]);
	}
};
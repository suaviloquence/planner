import { GeneralEducation, type Class, type ClassCode } from "./models/class";
import { TermType, type Planner } from "./models/planner";

const _classes: Record<string, Record<string, Class>> = {
	"CLNI": {
		"1A": {
			code: { department: "CLNI", number: "1A" },
			name: "Introduction to University Life and Learning",
			description: "Orientation to and exploration of the nature of the liberal arts, and of learning at research universities. Topics include: academic planning for upper-division coursework; enrollment processes; and understanding pathways to degree completion; UCSC resources that support health and well-being strategies for academic success; the cultivation of just communities; the prevention of sexual harassment and violence; campus conduct policies; awareness of risks associated with drug and/or alcohol use; and an introduction to traditions of community-engaged learning, ground-breaking research, and interdisciplinary thinking that define a UC Santa Cruz degree. This course can be taken for Pass/No Pass grading only.",
			units: 1,
		},
	},
	"CSE": {
		"20": {
			code: { department: "CSE", number: "20" },
			name: "Beginning Programming in Python",
			description: "Provides students with Python programming skills and the ability to design programs and read Python code. Topics include data types, control flow, methods and advanced functions, built-in data structures, and introduction to OOP. No prior programming experience is required. Students may not receive credit for CSE 20 after receiving credit for CSE 30. Students with prior programming experience (especially in Python) are encouraged to take CSE Testout Exam to be evaluated for their readiness to take CSE 30 directly: https://undergrad.soe.ucsc.edu/cse-20-testout-exam.",
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

	async getPlanner(): Promise<Planner> {
		return Promise.resolve({
			terms: [
				{
					type: TermType.Summer,
					year: 2023,
					classes: [
						_classes["CLNI"]["1A"],
					],
				},
				{
					type: TermType.Fall,
					year: 2023,
					classes: [
						_classes["CSE"]["20"],
					],
				},
			],
		});
	}
};
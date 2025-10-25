import type { RouterOutput } from "@habinook/trpc";
import type { Frequency } from "../today/types";

type Habit = RouterOutput["habits"]["getAll"][0];

export type InstanceStatus =
	| "completed"
	| "skipped"
	| "pending"
	| "not_due"
	| "missed";

export interface Instance {
	timeSlot?: string;
	status: InstanceStatus;
}

export interface ProgressHeaderProps {
	overallProgress: number;
	dateRange: [Date, Date];
	formatDate: (date: Date) => string;
}

export interface ProgressScreenProps {
	habits: Habit[];
	instancesByHabitDate: Map<string, Map<string, Instance[]>>;
	toggleInstance: (
		habitId: string,
		date: Date,
		checked: boolean,
		timeSlot?: string,
	) => void;
	dateRange: [Date, Date];
	overallProgress?: number;
}

export type { Frequency };

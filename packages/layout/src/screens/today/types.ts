import type { frequencies } from "@habinook/db/features/habit-tracking/frequencies.schema";
import type { habitLogs } from "@habinook/db/features/habit-tracking/habit_logs.schema";
import type { habits } from "@habinook/db/features/habit-tracking/habits.schema";
import type { InferSelectModel } from "drizzle-orm";

export type Frequency = InferSelectModel<typeof frequencies>;
export type Habit = InferSelectModel<typeof habits> & {
	currentStreak?: number;
	longestStreak?: number;
	frequencies: Frequency[] | null;
};
export type HabitLog = InferSelectModel<typeof habitLogs>;

export type {
	BaseFrequencyConfig,
	DailyConfig,
	DaysOfWeekConfig,
	EveryXPeriodConfig,
	FrequencyConfig,
	Period,
	TimesPerPeriodConfig,
} from "@habinook/db/features/habit-tracking/frequencies.schema";

export interface TimeInstance {
	habitId: string;
	time: string; // "HH:MM"
	status: "completed" | "skipped" | "pending";
}
export interface TodayScreenProps {
	now: Date;
	loadingHabits: boolean;
	dueToday: Habit[];
	completedToday: Habit[];
	skippedToday: Habit[];
	totalCount: number;
	doneCount: number;
	progress: number;
	formatFrequency: (freq: Frequency) => string;
	completeHabit: (habitId: string, targetTimeSlot?: string) => void;
	skipHabit: (habitId: string, targetTimeSlot?: string) => void;
	// Optional map of per-time-slot instances by habit id
	timeInstancesByHabit?: Map<string, TimeInstance[]>;
}

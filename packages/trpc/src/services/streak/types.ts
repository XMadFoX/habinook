import type {
	BaseFrequencyConfig,
	DailyConfig,
	DaysOfWeekConfig,
	EveryXPeriodConfig,
	FrequencyConfig,
	Period,
	TimesPerPeriodConfig,
} from "@habinook/db/features/habit-tracking/frequencies.schema";

export type HabitLog = {
	targetDate: Date;
	targetTimeSlot: string | null;
	loggedAt: Date;
	status: "completed" | "skipped" | "missed" | "partial_completed";
};

export type Streak = {
	startDate: Date;
	endDate: Date;
	length: number;
};

export type {
	Period,
	DailyConfig,
	DaysOfWeekConfig,
	TimesPerPeriodConfig,
	EveryXPeriodConfig,
	BaseFrequencyConfig,
	FrequencyConfig,
};

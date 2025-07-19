import { relations } from "drizzle-orm";
import { date, jsonb, pgEnum, pgTable, uuid } from "drizzle-orm/pg-core";
import { habits } from "./habits.schema";

/**
 * Allowed period units for frequencies.
 */
export type Period = "day" | "week" | "month" | "year";

/**
 * Base configuration for all frequency types, allowing for time-based occurrences and custom tolerance.
 */
export interface BaseFrequencyConfig {
	/**
	 * An array of "HH:MM" strings (local time) for time-based occurrences, e.g., ["08:00", "12:00"].
	 * If defined, the habit requires completion at these specific times.
	 */
	times?: string[];
	/**
	 * The tolerance window in minutes around each scheduled time for a completion to count.
	 * Defaults to 30 minutes if not specified when `times` are present.
	 */
	completionToleranceMinutes?: number;
	/**
	 * The IANA timezone ID (e.g., "America/New_York", "Europe/Berlin") in which the `times` are specified.
	 * This is crucial for recurring daily habits to correctly account for the user's local day and DST.
	 */
	timezoneId?: string;
}
/**
 * Daily frequency at specific times for a habit.
 * Extends BaseFrequencyConfig to include time-based scheduling and tolerance.
 * @property times: array of "HH:MM" strings (UTC)
 */
export interface DailyConfig extends BaseFrequencyConfig {}

/**
 * Frequency on specific days of the week.
 * days: numbers 0 (Sunday) through 6 (Saturday).
 * Extends BaseFrequencyConfig to allow time-based scheduling for each day.
 */
export interface DaysOfWeekConfig extends BaseFrequencyConfig {
	days: number[];
}

/**
 * Frequency a number of times per period.
 * count: how many times.
 * period: "day" | "week" | "month" | "year".
 * Extends BaseFrequencyConfig to allow time-based scheduling for each occurrence.
 */
export interface TimesPerPeriodConfig extends BaseFrequencyConfig {
	count: number;
	period: Period;
}

/**
 * Frequency every X periods.
 * interval: gap between occurrences.
 * period: "day" | "week" | "month" | "year".
 * Extends BaseFrequencyConfig to allow time-based scheduling for each occurrence.
 */
export interface EveryXPeriodConfig extends BaseFrequencyConfig {
	interval: number;
	period: Period;
}

/**
 * Union type for all frequency configurations.
 */
export type FrequencyConfig =
	| DailyConfig
	| DaysOfWeekConfig
	| TimesPerPeriodConfig
	| EveryXPeriodConfig;
export const frequencyTypeEnum = pgEnum("frequency_type", [
	"daily",
	"days_of_week",
	"times_per_period",
	"every_x_period",
]);

export const frequencies = pgTable("frequencies", {
	id: uuid("id").defaultRandom().primaryKey(),
	habitId: uuid("habit_id")
		.notNull()
		.references(() => habits.id),
	type: frequencyTypeEnum("type").notNull(),
	config: jsonb("config").$type<FrequencyConfig>().notNull(),
	activeFrom: date("active_from", { mode: "date" }).notNull(),
	activeUntil: date("active_until", { mode: "date" }),
});

export const frequenciesRelations = relations(frequencies, ({ one }) => ({
	habit: one(habits, {
		fields: [frequencies.habitId],
		references: [habits.id],
	}),
}));

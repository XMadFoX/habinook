import { TZDate } from "@date-fns/tz";
import { db, schema } from "@habinook/db";
import {
	addDays,
	addMonths,
	addWeeks,
	addYears,
	isSameDay,
	startOfDay,
	startOfMonth,
	startOfWeek,
	startOfYear,
} from "date-fns";
import { and, asc, desc, eq } from "drizzle-orm";
import {
	type BaseFrequencyConfig,
	calculateDailyStreaks,
	calculateDaysOfWeekStreaks,
	calculateEveryXPeriodStreaks,
	calculateTimesPerPeriodStreaks,
	type DailyConfig,
	type DaysOfWeekConfig,
	type EveryXPeriodConfig,
	type FrequencyConfig,
	type Streak,
	type TimesPerPeriodConfig,
} from "./streak";

/**
 * Determines if a streak is currently active based on the last completed date and frequency rules.
 * @param lastCompletedDate The endDate of the last calculated streak.
 * @param frequencyType The type of frequency (daily, days_of_week, etc.).
 * @param config The frequency configuration.
 * @param timezoneId The IANA timezone ID for the habit.
 * @returns True if the streak is active, false otherwise.
 */
function isStreakActive(
	lastCompletedDate: Date,
	frequencyType:
		| "daily"
		| "days_of_week"
		| "times_per_period"
		| "every_x_period",
	config: FrequencyConfig,
	timezoneId: string,
): boolean {
	console.log(
		`[isStreakActive] Checking for lastCompletedDate: ${
			lastCompletedDate.toISOString().split("T")[0]
		}, frequencyType: ${frequencyType}, timezoneId: ${timezoneId}`,
	);
	const todayInTimezone = startOfDay(TZDate.tz(timezoneId));
	const lastCompletedInTimezone = startOfDay(
		new TZDate(lastCompletedDate.getTime(), timezoneId),
	);
	console.log(
		`[isStreakActive] todayInTimezone: ${
			todayInTimezone.toISOString().split("T")[0]
		}, lastCompletedInTimezone: ${
			lastCompletedInTimezone.toISOString().split("T")[0]
		}`,
	);

	switch (frequencyType) {
		case "daily": {
			const dayDifference = Math.round(
				(todayInTimezone.getTime() - lastCompletedInTimezone.getTime()) /
					(1000 * 60 * 60 * 24),
			);
			console.log(
				`[isStreakActive - daily] dayDifference: ${dayDifference}, result: ${
					dayDifference <= 1
				}`,
			);
			return dayDifference <= 1;
		}

		case "days_of_week": {
			const daysOfWeekConfig = config as DaysOfWeekConfig;
			const sortedDays = [...daysOfWeekConfig.days].sort();

			if (isSameDay(lastCompletedInTimezone, todayInTimezone)) {
				console.log(
					`[isStreakActive - days_of_week] lastCompletedDate is today, result: true`,
				);
				return true;
			}

			const nextExpectedDayInTimezone = new Date(lastCompletedInTimezone);
			let foundNextExpectedDay = false;
			for (let i = 0; i < 7; i++) {
				nextExpectedDayInTimezone.setDate(
					nextExpectedDayInTimezone.getDate() + 1,
				);
				if (sortedDays.includes(nextExpectedDayInTimezone.getDay())) {
					foundNextExpectedDay = true;
					break;
				}
			}

			if (
				foundNextExpectedDay &&
				isSameDay(nextExpectedDayInTimezone, todayInTimezone)
			) {
				console.log(
					`[isStreakActive - days_of_week] nextExpectedDay is today: ${
						nextExpectedDayInTimezone.toISOString().split("T")[0]
					}, result: true`,
				);
				return true;
			}

			console.log(`[isStreakActive - days_of_week] Streak not active.`);
			return false;
		}

		case "times_per_period": {
			const timesPerPeriodConfig = config as TimesPerPeriodConfig;
			const lastCompletedPeriodStart = (() => {
				switch (timesPerPeriodConfig.period) {
					case "day":
						return lastCompletedInTimezone;
					case "week":
						return startOfWeek(lastCompletedInTimezone, { weekStartsOn: 0 });
					case "month":
						return startOfMonth(lastCompletedInTimezone);
					case "year":
						return startOfYear(lastCompletedInTimezone);
					default:
						return lastCompletedInTimezone;
				}
			})();

			const todayPeriodStart = (() => {
				switch (timesPerPeriodConfig.period) {
					case "day":
						return todayInTimezone;
					case "week":
						return startOfWeek(todayInTimezone, { weekStartsOn: 0 });
					case "month":
						return startOfMonth(todayInTimezone);
					case "year":
						return startOfYear(todayInTimezone);
					default:
						return todayInTimezone;
				}
			})();

			console.log(
				`[isStreakActive - times_per_period] lastCompletedPeriodStart: ${
					lastCompletedPeriodStart.toISOString().split("T")[0]
				}, todayPeriodStart: ${todayPeriodStart.toISOString().split("T")[0]}`,
			);
			if (isSameDay(lastCompletedPeriodStart, todayPeriodStart)) {
				console.log(
					`[isStreakActive - times_per_period] lastCompletedPeriod is same as today's, result: true`,
				);
				return true;
			}

			let nextExpectedPeriodStart: Date;
			switch (timesPerPeriodConfig.period) {
				case "day":
					nextExpectedPeriodStart = startOfDay(
						new Date(
							lastCompletedPeriodStart.getFullYear(),
							lastCompletedPeriodStart.getMonth(),
							lastCompletedPeriodStart.getDate() + 1,
						),
					);
					break;
				case "week":
					nextExpectedPeriodStart = startOfDay(
						new Date(
							lastCompletedPeriodStart.getFullYear(),
							lastCompletedPeriodStart.getMonth(),
							lastCompletedPeriodStart.getDate() + 7,
						),
					);
					break;
				case "month":
					nextExpectedPeriodStart = startOfDay(
						new Date(
							lastCompletedPeriodStart.getFullYear(),
							lastCompletedPeriodStart.getMonth() + 1,
							lastCompletedPeriodStart.getDate(),
						),
					);
					if (
						nextExpectedPeriodStart.getMonth() !==
						(lastCompletedPeriodStart.getMonth() + 1) % 12
					) {
						nextExpectedPeriodStart = startOfDay(
							new Date(
								lastCompletedPeriodStart.getFullYear(),
								lastCompletedPeriodStart.getMonth() + 1,
								1,
							),
						);
					}
					break;
				case "year":
					nextExpectedPeriodStart = startOfDay(
						new Date(
							lastCompletedPeriodStart.getFullYear() + 1,
							lastCompletedPeriodStart.getMonth(),
							lastCompletedPeriodStart.getDate(),
						),
					);
					break;
				default:
					return false;
			}

			console.log(
				`[isStreakActive - times_per_period] nextExpectedPeriodStart: ${
					nextExpectedPeriodStart.toISOString().split("T")[0]
				}`,
			);
			const timesPeriodResult = isSameDay(
				todayPeriodStart,
				nextExpectedPeriodStart,
			);
			console.log(
				`[isStreakActive - times_per_period] todayPeriodStart is same as nextExpectedPeriod, result: ${timesPeriodResult}`,
			);
			return timesPeriodResult;
		}

		case "every_x_period": {
			const everyXPeriodConfig = config as EveryXPeriodConfig;

			console.log(
				`[isStreakActive - every_x_period] lastCompletedInTimezone: ${
					lastCompletedInTimezone.toISOString().split("T")[0]
				}, todayInTimezone: ${todayInTimezone.toISOString().split("T")[0]}`,
			);
			if (isSameDay(lastCompletedInTimezone, todayInTimezone)) {
				console.log(
					`[isStreakActive - every_x_period] lastCompletedDate is today, result: true`,
				);
				return true;
			}

			let expectedNextDate = new Date(lastCompletedInTimezone);
			switch (everyXPeriodConfig.period) {
				case "day":
					expectedNextDate = addDays(
						expectedNextDate,
						everyXPeriodConfig.interval,
					);
					break;
				case "week":
					expectedNextDate = addWeeks(
						expectedNextDate,
						everyXPeriodConfig.interval,
					);
					break;
				case "month":
					expectedNextDate = addMonths(
						expectedNextDate,
						everyXPeriodConfig.interval,
					);
					break;
				case "year":
					expectedNextDate = addYears(
						expectedNextDate,
						everyXPeriodConfig.interval,
					);
					break;
			}
			console.log(
				`[isStreakActive - every_x_period] expectedNextDate: ${
					expectedNextDate.toISOString().split("T")[0]
				}`,
			);
			const everyXPeriodResult = isSameDay(
				startOfDay(expectedNextDate),
				todayInTimezone,
			);
			console.log(
				`[isStreakActive - every_x_period] result: ${everyXPeriodResult}`,
			);
			return everyXPeriodResult;
		}

		default:
			console.warn(`isStreakActive: Unknown frequency type: ${frequencyType}`);
			return false;
	}
}

export async function updateStreak(
	habitId: string,
	userId: string,
): Promise<{ success: boolean }> {
	console.log(
		`[updateStreak] Starting streak update for habitId: ${habitId}, userId: ${userId}`,
	);
	const habit = await db.query.habits.findFirst({
		where: and(eq(schema.habits.id, habitId), eq(schema.habits.userId, userId)),
		with: {
			frequencies: { orderBy: desc(schema.frequencies.activeFrom), limit: 1 },
		},
	});
	console.log(`[updateStreak] Fetched habit: ${habit?.id || "not found"}`);

	if (!habit) {
		console.error(`Habit with ID ${habitId} not found for user ${userId}.`);
		return { success: false };
	}

	const frequency = habit.frequencies[0];
	console.log(
		`[updateStreak] Fetched frequency: ${frequency ? frequency.type : "not found"}`,
	);
	if (!frequency) {
		console.log(
			`No frequency defined for habit ${habitId}, skipping streak calculation.`,
		);
		return { success: true };
	}

	if (!frequency.config.timezoneId) {
		console.error(
			`Frequency config for habit ${habitId} is missing timezoneId.`,
		);
		return { success: false };
	}

	const logs = await db.query.habitLogs.findMany({
		where: eq(schema.habitLogs.habitId, habitId),
		orderBy: asc(schema.habitLogs.targetDate),
	});
	console.log(`[updateStreak] Fetched ${logs.length} habit logs.`);

	let calculatedStreaks: Streak[];
	const baseConfig = frequency.config as BaseFrequencyConfig;
	switch (frequency.type) {
		case "daily":
			calculatedStreaks = calculateDailyStreaks(
				logs,
				baseConfig as DailyConfig,
			);
			break;
		case "days_of_week":
			calculatedStreaks = calculateDaysOfWeekStreaks(
				logs,
				baseConfig as DaysOfWeekConfig,
			);
			break;
		case "times_per_period":
			calculatedStreaks = calculateTimesPerPeriodStreaks(
				logs,
				baseConfig as TimesPerPeriodConfig,
			);
			break;
		case "every_x_period":
			calculatedStreaks = calculateEveryXPeriodStreaks(
				logs,
				baseConfig as EveryXPeriodConfig,
			);
			break;
		default:
			console.log(
				`Streak calculation for frequency type '${frequency.type}' on habit ${habitId} is not yet implemented. Falling back to daily streak calculation.`,
			);
			calculatedStreaks = calculateDailyStreaks(
				logs,
				baseConfig as DailyConfig,
			);
			break;
	}
	console.log(
		`[updateStreak] Calculated streaks: ${JSON.stringify(calculatedStreaks.map((s) => ({ start: s.startDate.toISOString().split("T")[0], end: s.endDate ? s.endDate.toISOString().split("T")[0] : null, length: s.length })))}`,
	);
	if (calculatedStreaks.length === 0) {
		await db
			.delete(schema.habitStreaks)
			.where(eq(schema.habitStreaks.habitId, habitId));
		return { success: true };
	}

	const finalStreaksToInsert = calculatedStreaks.map((streak, index) => {
		let finalEndDate: Date | null = streak.endDate;
		if (index === calculatedStreaks.length - 1) {
			if (
				isStreakActive(
					streak.endDate,
					frequency.type,
					frequency.config,
					frequency.config.timezoneId ?? "",
				)
			) {
				finalEndDate = null;
			}
		}
		return {
			habitId,
			userId,
			startDate: streak.startDate,
			endDate: finalEndDate,
			length: streak.length,
		};
	});
	console.log(
		`[updateStreak] Final streaks to insert: ${JSON.stringify(finalStreaksToInsert.map((s) => ({ start: s.startDate.toISOString().split("T")[0], end: s.endDate ? s.endDate.toISOString().split("T")[0] : null, length: s.length })))}`,
	);
	await db.transaction(async (tx) => {
		await tx
			.delete(schema.habitStreaks)
			.where(eq(schema.habitStreaks.habitId, habitId));
		if (finalStreaksToInsert.length > 0) {
			await tx.insert(schema.habitStreaks).values(finalStreaksToInsert);
		}
	});
	return { success: true };
}

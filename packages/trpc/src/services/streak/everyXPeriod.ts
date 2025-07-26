import { addDays, addMonths, addWeeks, addYears } from "date-fns";
import type { EveryXPeriodConfig, HabitLog, Period, Streak } from "./types";
import { isDayOrPeriodCompleted } from "./utils";

/**
 * Calculates all historical and current streaks for an every_x_period habit based on its logs.
 *
 * @param logs A list of all habit logs.
 * @param config The every_x_period configuration.
 * @returns An array of streaks.
 */
export function calculateEveryXPeriodStreaks(
	logs: HabitLog[],
	config: EveryXPeriodConfig,
): Streak[] {
	console.log(
		`[calculateEveryXPeriodStreaks] Starting calculation for every_x_period habit. Logs count: ${logs.length}, Config: ${JSON.stringify(
			config,
		)}`,
	);
	// Group logs by targetDate (YYYY-MM-DD)
	const logsByDay = new Map<string, HabitLog[]>();
	for (const log of logs) {
		const dateKey = log.targetDate.toISOString().split("T")[0];
		if (dateKey && !logsByDay.has(dateKey)) {
			logsByDay.set(dateKey, []);
		}
		if (dateKey) {
			logsByDay.get(dateKey)?.push(log);
		}
	}

	const completedDates: Date[] = [];
	const sortedDateKeys = Array.from(logsByDay.keys()).sort();

	for (const dateKey of sortedDateKeys) {
		const dailyLogs = logsByDay.get(dateKey);
		if (dailyLogs) {
			const isCompleted = isDayOrPeriodCompleted(
				dailyLogs,
				config.times,
				config.timezoneId,
				config.completionToleranceMinutes,
			);
			if (isCompleted) {
				completedDates.push(new Date(dateKey));
			}
		}
	}

	console.log(
		`[calculateEveryXPeriodStreaks] Completed dates: ${completedDates.map(
			(d) => d.toISOString().split("T")[0],
		)}`,
	);
	if (completedDates.length === 0) {
		console.log(
			`[calculateEveryXPeriodStreaks] No completed dates, returning empty array.`,
		);
		return [];
	}

	const streaks: Streak[] = [];
	// Check if we have at least one completed date
	if (completedDates.length > 0 && completedDates[0]) {
		let currentStreak: Streak = {
			startDate: completedDates[0],
			endDate: completedDates[0],
			length: 1,
		};

		const addInterval = (
			date: Date,
			interval: number,
			period: Period,
		): Date => {
			switch (period) {
				case "day":
					return addDays(date, interval);
				case "week":
					return addWeeks(date, interval);
				case "month":
					return addMonths(date, interval);
				case "year":
					return addYears(date, interval);
			}
		};

		for (let i = 1; i < completedDates.length; i++) {
			const previousDate = currentStreak.endDate;
			const currentDate = completedDates[i];

			// Check if both dates are defined
			if (previousDate && currentDate) {
				const expectedNextDate = addInterval(
					previousDate,
					config.interval,
					config.period,
				);

				// Normalize both dates to start of day for comparison
				const expectedNormalized = new Date(
					expectedNextDate.getFullYear(),
					expectedNextDate.getMonth(),
					expectedNextDate.getDate(),
				).getTime();
				const currentNormalized = new Date(
					currentDate.getFullYear(),
					currentDate.getMonth(),
					currentDate.getDate(),
				).getTime();

				if (expectedNormalized === currentNormalized) {
					currentStreak.endDate = currentDate;
					currentStreak.length++;
				} else {
					streaks.push(currentStreak);
					currentStreak = {
						startDate: currentDate,
						endDate: currentDate,
						length: 1,
					};
				}
			}
		}
		streaks.push(currentStreak);
	}
	console.log(
		`[calculateEveryXPeriodStreaks] Final streaks: ${JSON.stringify(
			streaks.map((s) => ({
				start: s.startDate.toISOString().split("T")[0],
				end: s.endDate.toISOString().split("T")[0],
				length: s.length,
			})),
		)}`,
	);
	return streaks;
}

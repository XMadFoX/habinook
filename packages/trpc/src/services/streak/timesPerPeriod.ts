import { addDays, addMonths, addWeeks, addYears } from "date-fns";
import type { HabitLog, Streak, TimesPerPeriodConfig } from "./types";
import { isDayOrPeriodCompleted } from "./utils";

/**
 * Calculates all historical and current streaks for a times_per_period habit based on its logs.
 *
 * @param logs A list of all habit logs.
 * @param config The times_per_period configuration.
 * @returns An array of streaks.
 */
export function calculateTimesPerPeriodStreaks(
	logs: HabitLog[],
	config: TimesPerPeriodConfig,
): Streak[] {
	console.log(
		`[calculateTimesPerPeriodStreaks] Starting calculation for times_per_period habit. Logs count: ${logs.length}, Config: ${JSON.stringify(
			config,
		)}`,
	);
	// Group logs by the start of their respective period
	const logsByPeriod = new Map<number, HabitLog[]>(); // Key is timestamp of period start
	for (const log of logs) {
		const d = log.targetDate;
		let periodStart: Date;
		switch (config.period) {
			case "day":
				periodStart = new Date(
					Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
				);
				break;
			case "week":
				periodStart = new Date(
					Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()),
				);
				break;
			case "month":
				periodStart = new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1));
				break;
			case "year":
				periodStart = new Date(Date.UTC(d.getFullYear(), 0, 1));
				break;
			default:
				periodStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
		}
		const key = periodStart.getTime();
		if (!logsByPeriod.has(key)) {
			logsByPeriod.set(key, []);
		}
		logsByPeriod.get(key)?.push(log);
	}
	console.log(
		`[calculateTimesPerPeriodStreaks] logsByPeriod: ${JSON.stringify(
			Object.fromEntries(logsByPeriod.entries()),
		)}`,
	);

	const completedPeriods: Date[] = [];
	const sortedPeriodKeys = Array.from(logsByPeriod.keys()).sort(
		(a, b) => a - b,
	);

	for (const periodKey of sortedPeriodKeys) {
		const currentPeriodLogs = logsByPeriod.get(periodKey)!;
		const numberOfCompletedInstances = currentPeriodLogs.filter((log) =>
			isDayOrPeriodCompleted(
				[log],
				config.times,
				config.timezoneId,
				config.completionToleranceMinutes,
			),
		).length;

		if (numberOfCompletedInstances >= config.count) {
			completedPeriods.push(new Date(periodKey));
		}
	}

	console.log(
		`[calculateTimesPerPeriodStreaks] Completed periods: ${completedPeriods.map(
			(d) => d.toISOString().split("T")[0],
		)}`,
	);
	if (completedPeriods.length === 0) {
		console.log(
			`[calculateTimesPerPeriodStreaks] No completed periods, returning empty array.`,
		);
		return [];
	}

	const streaks: Streak[] = [];
	let currentStreak: Streak = {
		startDate: completedPeriods[0]!,
		endDate: completedPeriods[0]!,
		length: 1,
	};

	const addOnePeriod = (date: Date): Date => {
		switch (config.period) {
			case "day":
				return addDays(date, 1);
			case "week":
				return addWeeks(date, 1);
			case "month":
				return addMonths(date, 1);
			case "year":
				return addYears(date, 1);
			default:
				return new Date(date);
		}
	};

	for (let i = 1; i < completedPeriods.length; i++) {
		const prevPeriod = completedPeriods[i - 1]!;
		const currPeriod = completedPeriods[i]!;

		if (addOnePeriod(prevPeriod).getTime() === currPeriod.getTime()) {
			currentStreak.endDate = currPeriod;
			currentStreak.length++;
		} else {
			streaks.push(currentStreak);
			currentStreak = {
				startDate: currPeriod,
				endDate: currPeriod,
				length: 1,
			};
		}
	}
	streaks.push(currentStreak);
	console.log(
		`[calculateTimesPerPeriodStreaks] Final streaks: ${JSON.stringify(
			streaks.map((s) => ({
				start: s.startDate.toISOString().split("T")[0],
				end: s.endDate.toISOString().split("T")[0],
				length: s.length,
			})),
		)}`,
	);
	return streaks;
}

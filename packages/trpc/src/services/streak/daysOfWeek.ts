import type { DaysOfWeekConfig, HabitLog, Streak } from "./types";
import { isDayOrPeriodCompleted } from "./utils";

/**
 * Calculates all historical and current streaks for a days_of_week habit based on its logs.
 *
 * @param logs A list of all habit logs.
 * @param config The days_of_week configuration.
 * @returns An array of streaks.
 */
export function calculateDaysOfWeekStreaks(
	logs: HabitLog[],
	config: DaysOfWeekConfig,
): Streak[] {
	console.log(
		`[calculateDaysOfWeekStreaks] Starting calculation for days_of_week habit. Logs count: ${logs.length}, Config: ${JSON.stringify(
			config,
		)}`,
	);
	const daysSet = new Set(config.days);
	const logsByDay = new Map<string, HabitLog[]>();
	for (const log of logs) {
		const dateKey = log.targetDate.toISOString().split("T")[0]!;
		if (!logsByDay.has(dateKey)) {
			logsByDay.set(dateKey, []);
		}
		logsByDay.get(dateKey)?.push(log);
	}

	const completedDays: Date[] = [];
	const sortedDateKeys = Array.from(logsByDay.keys()).sort();
	for (const dateKey of sortedDateKeys) {
		const dailyLogs = logsByDay.get(dateKey)!;
		const dayOfWeek = new Date(dateKey).getDay();
		if (daysSet.has(dayOfWeek)) {
			const isCompleted = isDayOrPeriodCompleted(
				dailyLogs,
				config.times,
				config.timezoneId,
				config.completionToleranceMinutes,
			);
			if (isCompleted) {
				completedDays.push(new Date(dateKey));
			}
		}
	}

	console.log(
		`[calculateDaysOfWeekStreaks] Completed days: ${completedDays.map(
			(d) => d.toISOString().split("T")[0],
		)}`,
	);
	if (completedDays.length === 0) {
		console.log(
			`[calculateDaysOfWeekStreaks] No completed days, returning empty array.`,
		);
		return [];
	}

	const streaks: Streak[] = [];
	let currentStreak: Streak = {
		startDate: completedDays[0]!,
		endDate: completedDays[0]!,
		length: 1,
	};

	for (let i = 1; i < completedDays.length; i++) {
		const previousDay = completedDays[i - 1]!;
		const currentDay = completedDays[i]!;

		// Find the next expected active day based on the frequency config
		const nextExpectedDay = new Date(previousDay);
		let foundNext = false;
		for (let j = 0; j < 7; j++) {
			nextExpectedDay.setDate(nextExpectedDay.getDate() + 1);
			if (daysSet.has(nextExpectedDay.getDay())) {
				foundNext = true;
				break;
			}
		}

		if (
			foundNext &&
			nextExpectedDay.toDateString() === currentDay.toDateString()
		) {
			currentStreak.endDate = currentDay;
			currentStreak.length++;
		} else {
			streaks.push(currentStreak);
			currentStreak = { startDate: currentDay, endDate: currentDay, length: 1 };
		}
	}
	streaks.push(currentStreak);
	console.log(
		`[calculateDaysOfWeekStreaks] Final streaks: ${JSON.stringify(
			streaks.map((s) => ({
				start: s.startDate.toISOString().split("T")[0],
				end: s.endDate.toISOString().split("T")[0],
				length: s.length,
			})),
		)}`,
	);
	return streaks;
}

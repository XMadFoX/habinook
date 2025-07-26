import type { DailyConfig, HabitLog, Streak } from "./types";
import { isDayOrPeriodCompleted } from "./utils";

/**
 * Calculates all historical and current streaks for a daily habit based on its logs.
 * @param logs A list of all habit logs.
 * @param config The daily configuration.
 * @returns An array of streaks.
 */
export function calculateDailyStreaks(
	logs: HabitLog[],
	config: DailyConfig,
): Streak[] {
	console.log(
		`[calculateDailyStreaks] Starting calculation for daily habit. Logs count: ${logs.length}`,
	);
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

	const completedDays: Date[] = [];
	for (const [dateKey, dailyLogs] of logsByDay.entries()) {
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

	console.log(
		`[calculateDailyStreaks] Completed days: ${completedDays.map(
			(d) => d.toISOString().split("T")[0],
		)}`,
	);
	if (completedDays.length === 0) {
		console.log(
			`[calculateDailyStreaks] No completed days, returning empty array.`,
		);
		return [];
	}

	completedDays.sort((a, b) => a.getTime() - b.getTime());

	const streaks: Streak[] = [];
	// Check if we have at least one completed day
	if (completedDays.length > 0 && completedDays[0]) {
		let currentStreak: Streak = {
			startDate: completedDays[0],
			endDate: completedDays[0],
			length: 1,
		};

		for (let i = 1; i < completedDays.length; i++) {
			const currentDay = completedDays[i];
			const previousDay = completedDays[i - 1];

			// Check if both days are defined
			if (currentDay && previousDay) {
				const dayDifference = Math.round(
					(currentDay.getTime() - previousDay.getTime()) /
						(1000 * 60 * 60 * 24),
				);

				if (dayDifference === 1) {
					currentStreak.endDate = currentDay;
					currentStreak.length++;
				} else if (dayDifference > 1) {
					streaks.push(currentStreak);
					currentStreak = {
						startDate: currentDay,
						endDate: currentDay,
						length: 1,
					};
				}
			}
		}
		streaks.push(currentStreak);
	}
	console.log(
		`[calculateDailyStreaks] Final streaks: ${JSON.stringify(
			streaks.map((s) => ({
				start: s.startDate.toISOString().split("T")[0],
				end: s.endDate.toISOString().split("T")[0],
				length: s.length,
			})),
		)}`,
	);
	return streaks;
}

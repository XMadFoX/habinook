import type { RouterOutput } from "@habinook/trpc";
import { format } from "date-fns";
export type HabitLog = RouterOutput["habitLogs"]["getAllForDateRange"][number];

/**
 * Transforms an array of log entries into a Map, using a generated key for each log.
 * The key is composed of habitId, formatted targetDate, and targetTimeSlot (or "single" if not present).
 * @param logs An array of log objects.
 * @returns A Map where keys are generated strings and values are the log objects.
 */
export const getLogsByKey = (logs: HabitLog[]) => {
	const map = new Map<string, HabitLog>();
	for (const log of logs) {
		const dateStr = format(log.targetDate, "yyyy-MM-dd");
		const key = `${log.habitId}-${dateStr}-${log.targetTimeSlot || "single"}`;
		map.set(key, log);
	}
	return map;
};

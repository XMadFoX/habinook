import type {
	Instance,
	InstanceStatus,
} from "@habinook/layout/src/screens/progress/types";
import type { RouterOutput } from "@habinook/trpc";
import { endOfDay, format, isBefore } from "date-fns";
import { isDueOnDate } from "./frequencyUtils";
import type { getLogsByKey } from "./logUtils";

export type Habit = RouterOutput["habits"]["getAll"][number];
/**
 * Organizes habit instances by habit ID and date, determining their status (due, not due, missed, pending).
 * @param habits An array of habit objects.
 * @param logsByKey A Map where keys are generated from habit ID, date, and time slot, and values are log entries.
 * @param dates An array of dates to check for habit instances.
 * @param now The current date and time, used to determine if an instance is missed.
 * @returns A Map where keys are habit IDs and values are another Map. The inner Map has date strings as keys and arrays of Instance objects as values.
 */
export const getInstancesByHabitDate = (
	habits: Habit[] | undefined,
	logsByKey: ReturnType<typeof getLogsByKey>,
	dates: Date[],
	now: Date,
) => {
	const map = new Map<string, Map<string, Instance[]>>();
	if (!habits) return map;

	for (const habit of habits) {
		const habitMap = new Map<string, Instance[]>();
		const freqs = habit.frequencies ?? [];

		for (const date of dates) {
			const dateStr = format(date, "yyyy-MM-dd");
			const isDue = freqs.some((f) => isDueOnDate(f, date));
			if (!isDue) {
				habitMap.set(dateStr, [{ status: "not_due" as const }]);
				continue;
			}

			// Collect unique time slots from any frequency with times config
			const timeSlots = new Set<string>();
			for (const f of freqs.filter((f) => isDueOnDate(f, date))) {
				const cfg = f.config;
				if (Array.isArray(cfg.times)) {
					cfg.times.forEach((t: string) => timeSlots.add(t));
				}
			}

			const instances: Instance[] = [];
			if (timeSlots.size > 0) {
				// Timed habit
				for (const timeSlot of Array.from(timeSlots).sort()) {
					const key = `${habit.id}-${dateStr}-${timeSlot}`;
					const log = logsByKey.get(key);
					let status: InstanceStatus = isBefore(endOfDay(date), now)
						? "missed"
						: "pending";
					if (log) {
						status = log.status;
					}
					instances.push({ timeSlot, status });
				}
			} else {
				// Untimed habit
				const key = `${habit.id}-${dateStr}-single`;
				const log = logsByKey.get(key);
				let status: InstanceStatus = isBefore(endOfDay(date), now)
					? "missed"
					: "pending";
				if (log) {
					status = log.status;
				}
				instances.push({ status });
			}
			habitMap.set(dateStr, instances);
		}
		map.set(habit.id, habitMap);
	}
	return map;
};

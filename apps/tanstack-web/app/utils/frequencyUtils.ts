import type {
	DaysOfWeekConfig,
	EveryXPeriodConfig,
	Frequency,
} from "@habinook/layout/src/screens/today/types";
import { endOfDay, getDay, isAfter, isBefore, startOfDay } from "date-fns";

/**
 * Checks if a frequency is active on a given date.
 * @param freq The frequency object.
 * @param date The date to check against.
 * @returns True if the frequency is active on the date, false otherwise.
 */
export const isActiveOnDate = (freq: Frequency, date: Date): boolean => {
	const activeFrom = new Date(freq.activeFrom);
	const activeUntil = freq.activeUntil ? new Date(freq.activeUntil) : null;
	if (isBefore(date, startOfDay(activeFrom))) return false;
	if (activeUntil && isAfter(date, endOfDay(activeUntil))) return false;
	return true;
};

/**
 * Checks if a frequency is due on a given date.
 * @param freq The frequency object.
 * @param date The date to check against.
 * @returns True if the frequency is due on the date, false otherwise.
 */
export const isDueOnDate = (freq: Frequency, date: Date): boolean => {
	if (!isActiveOnDate(freq, date)) return false;

	switch (freq.type) {
		case "daily":
			return true;
		case "days_of_week": {
			const config = freq.config as DaysOfWeekConfig;
			const dow = getDay(date);
			return (config.days ?? []).includes(dow);
		}
		case "times_per_period": {
			return true;
		}
		case "every_x_period": {
			const config = freq.config as EveryXPeriodConfig;
			const base = startOfDay(new Date(freq.activeFrom));
			const diffDays = Math.floor(
				(startOfDay(date).getTime() - base.getTime()) / (1000 * 60 * 60 * 24),
			);
			if (config.period === "day") {
				return diffDays % config.interval === 0;
			}
			const factor =
				config.period === "week" ? 7 : config.period === "month" ? 30 : 365;
			return diffDays % (config.interval * factor) === 0;
		}
		default:
			return false;
	}
};

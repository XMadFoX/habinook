import { TZDate } from "@date-fns/tz";
import { addMinutes, isSameDay, isWithinInterval, subMinutes } from "date-fns";
import type { HabitLog } from "./types";

export function isTimeWithinTolerance(
	loggedAt: Date,
	targetDate: Date,
	scheduledTime: string,
	timezoneId: string,
	toleranceMinutes: number = 30,
): boolean {
	console.log(
		`[isTimeWithinTolerance] loggedAt: ${loggedAt.toISOString()}, targetDate: ${
			targetDate.toISOString().split("T")[0]
		}, scheduledTime: ${scheduledTime}, timezoneId: ${timezoneId}, toleranceMinutes: ${toleranceMinutes}`,
	);
	const parts = scheduledTime.split(":");
	const scheduledHours = Number(parts[0]);
	const scheduledMinutes = Number(parts[1]);
	if (Number.isNaN(scheduledHours) || Number.isNaN(scheduledMinutes)) {
		console.error(`Invalid scheduled time format: ${scheduledTime}`);
		return false;
	}
	const year = targetDate.getFullYear();
	const month = targetDate.getMonth();
	const day = targetDate.getDate();
	const scheduledZonedDate = new TZDate(
		year,
		month,
		day,
		scheduledHours,
		scheduledMinutes,
		0,
		0,
		timezoneId,
	);
	const scheduledUtc = new Date(scheduledZonedDate.getTime());
	const lowerBound = subMinutes(scheduledUtc, toleranceMinutes);
	const upperBound = addMinutes(scheduledUtc, toleranceMinutes);
	const intervalResult = isWithinInterval(loggedAt, {
		start: lowerBound,
		end: upperBound,
	});
	console.log(
		`[isTimeWithinTolerance] Calculated: lowerBound=${lowerBound.toISOString()}, upperBound=${upperBound.toISOString()}, result=${intervalResult}`,
	);
	return intervalResult;
}

export function isDayOrPeriodCompleted(
	logs: HabitLog[],
	scheduledTimes: string[] | undefined,
	timezoneId: string | undefined,
	toleranceMinutes: number | undefined,
): boolean {
	console.log(
		`[isDayOrPeriodCompleted] logs count: ${logs.length}, scheduledTimes: ${scheduledTimes}, timezoneId: ${timezoneId}, toleranceMinutes: ${toleranceMinutes}`,
	);
	if (!scheduledTimes || scheduledTimes.length === 0) {
		const result = logs.some(
			(log) =>
				log.status === "completed" && isSameDay(log.loggedAt, log.targetDate),
		);
		console.log(
			`[isDayOrPeriodCompleted] No scheduled times, result: ${result}`,
		);
		return result;
	}
	const effectiveTolerance = toleranceMinutes ?? 30;
	if (!timezoneId) {
		console.warn(
			"Time-based frequency but no timezoneId provided. Assuming completion failed.",
		);
		return false;
	}
	for (const scheduledTime of scheduledTimes) {
		const hasCompletion = logs.some(
			(log) =>
				log.status === "completed" &&
				log.targetTimeSlot === scheduledTime &&
				isSameDay(log.loggedAt, log.targetDate) &&
				isTimeWithinTolerance(
					log.loggedAt,
					log.targetDate,
					scheduledTime,
					timezoneId,
					effectiveTolerance,
				),
		);
		if (!hasCompletion) {
			return false;
		}
	}
	console.log(
		`[isDayOrPeriodCompleted] All scheduled times completed for the period.`,
	);
	return true;
}

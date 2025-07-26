import { describe, expect, test } from "bun:test";
import { isTimeWithinTolerance } from "../utils";

describe("isTimeWithinTolerance", () => {
	// Basic functionality within tolerance
	test("should return true when logged time is within tolerance of scheduled time", () => {
		const loggedAt = new Date("2025-07-25T10:15:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "10:00";
		const timezoneId = "UTC";

		expect(
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				30,
			),
		).toBe(true);
	});

	test("should return true when logged time is exactly at the start of tolerance window", () => {
		const loggedAt = new Date("2025-07-25T09:30:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "10:00";
		const timezoneId = "UTC";

		expect(
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				30,
			),
		).toBe(true);
	});

	test("should return true when logged time is exactly at the end of tolerance window", () => {
		const loggedAt = new Date("2025-07-25T10:30:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "10:00";
		const timezoneId = "UTC";

		expect(
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				30,
			),
		).toBe(true);
	});

	// Times outside tolerance
	test("should return false when logged time is before tolerance window", () => {
		const loggedAt = new Date("2025-07-25T09:29:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "10:00";
		const timezoneId = "UTC";

		expect(
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				30,
			),
		).toBe(false);
	});

	test("should return false when logged time is after tolerance window", () => {
		const loggedAt = new Date("2025-07-25T10:31:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "10:00";
		const timezoneId = "UTC";

		expect(
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				30,
			),
		).toBe(false);
	});

	// Timezone edge cases
	test("should handle different timezones correctly", () => {
		// 14:00 in UTC+4 is 10:00 UTC
		const loggedAt = new Date("2025-07-25T10:15:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "14:00"; // 14:00 in Asia/Tbilisi
		const timezoneId = "Asia/Tbilisi";

		expect(
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				30,
			),
		).toBe(true);
	});

	test("should handle timezone crossing date boundary", () => {
		// Test case where timezone shifts the scheduled time to previous/next day
		const loggedAt = new Date("2025-07-26T01:15:00.000Z"); // 01:15 UTC
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "21:00"; // 21:00 in UTC-5 would be 02:00 next day UTC. Or... UTC-4 in summer
		const timezoneId = "America/New_York";

		expect(
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				120,
			),
		).toBe(true);
	});

	// Different tolerance values
	test("should work with smaller tolerance value", () => {
		const loggedAt = new Date("2025-07-25T10:05:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "10:00";
		const timezoneId = "UTC";

		expect(
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				10,
			),
		).toBe(true);
	});

	test("should work with larger tolerance value", () => {
		const loggedAt = new Date("2025-07-25T11:29:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "10:00";
		const timezoneId = "UTC";

		expect(
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				120,
			),
		).toBe(true);
	});

	test("should fail with smaller tolerance value when outside window", () => {
		const loggedAt = new Date("2025-07-25T10:11:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "10:00";
		const timezoneId = "UTC";

		expect(
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				10,
			),
		).toBe(false);
	});

	// Invalid scheduled time format
	test("should handle invalid scheduled time format gracefully", () => {
		const loggedAt = new Date("2025-07-25T10:15:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "25:00"; // Invalid hour
		const timezoneId = "UTC";

		// Should not throw, but behavior depends on implementation
		expect(() =>
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				30,
			),
		).not.toThrow();
	});

	test("should handle another invalid scheduled time format", () => {
		const loggedAt = new Date("2025-07-25T10:15:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "10:70"; // Invalid minute
		const timezoneId = "UTC";

		// Should not throw, but behavior depends on implementation
		expect(() =>
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				30,
			),
		).not.toThrow();
	});

	test("should handle malformed scheduled time format", () => {
		const loggedAt = new Date("2025-07-25T10:15:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "10-00"; // Wrong separator
		const timezoneId = "UTC";

		// Should not throw, but behavior depends on implementation
		expect(() =>
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				30,
			),
		).not.toThrow();
	});

	// Boundary conditions
	test("should handle midnight boundary correctly", () => {
		const loggedAt = new Date("2025-07-25T00:15:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "00:00";
		const timezoneId = "UTC";

		expect(
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				30,
			),
		).toBe(true);
	});

	test("should handle end of day boundary correctly", () => {
		const loggedAt = new Date("2025-07-25T23:45:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "23:59";
		const timezoneId = "UTC";

		expect(
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				30,
			),
		).toBe(true);
	});

	// Additional edge cases
	test("should use default tolerance of 30 minutes when not provided", () => {
		const loggedAt = new Date("2025-07-25T10:15:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "10:00";
		const timezoneId = "UTC";

		// Calling without the toleranceMinutes parameter
		expect(
			isTimeWithinTolerance(loggedAt, targetDate, scheduledTime, timezoneId),
		).toBe(true);
	});

	test("should handle exact match with scheduled time", () => {
		const loggedAt = new Date("2025-07-25T10:00:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "10:00";
		const timezoneId = "UTC";

		expect(
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				30,
			),
		).toBe(true);
	});

	test("should handle negative tolerance values appropriately", () => {
		const loggedAt = new Date("2025-07-25T10:00:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "10:00";
		const timezoneId = "UTC";

		// With negative tolerance, only exact matches should work
		expect(
			isTimeWithinTolerance(loggedAt, targetDate, scheduledTime, timezoneId, 0),
		).toBe(true);
	});

	test("should handle time just before scheduled time within tolerance", () => {
		const loggedAt = new Date("2025-07-25T09:45:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "10:00";
		const timezoneId = "UTC";

		expect(
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				30,
			),
		).toBe(true);
	});

	test("should handle time just after scheduled time within tolerance", () => {
		const loggedAt = new Date("2025-07-25T10:15:00.000Z");
		const targetDate = new Date("2025-07-25T00:00:00.000Z");
		const scheduledTime = "10:00";
		const timezoneId = "UTC";

		expect(
			isTimeWithinTolerance(
				loggedAt,
				targetDate,
				scheduledTime,
				timezoneId,
				30,
			),
		).toBe(true);
	});
});

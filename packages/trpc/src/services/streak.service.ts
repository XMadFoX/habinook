import { db, schema } from "@habinook/db";
import { and, asc, desc, eq } from "drizzle-orm";

type HabitLog = {
	targetDate: Date;
	status: "completed" | "skipped" | "missed" | "partial_completed";
};

type Streak = {
	startDate: Date;
	endDate: Date;
	length: number;
};

/**
 * Calculates all historical and current streaks for a daily habit based on its logs.
 * This simplified and robust version considers only 'completed' logs to define a streak.
 * @param logs A list of all habit logs, which will be filtered internally.
 * @returns An array of all streaks found in the logs.
 */
function calculateDailyStreaks(logs: HabitLog[]): Streak[] {
	// Only 'completed' logs can form a streak for a daily habit.
	const completedLogs = logs
		.filter((log) => log.status === "completed")
		.sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());

	if (completedLogs.length === 0) return [];

	const streaks: Streak[] = [];
	// Start the first potential streak with the first completed log.
	let currentStreak: Streak = {
		startDate: completedLogs[0]!.targetDate,
		endDate: completedLogs[0]!.targetDate,
		length: 1,
	};

	for (let i = 1; i < completedLogs.length; i++) {
		const currentLog = completedLogs[i];
		const previousLog = completedLogs[i - 1];

		if (!currentLog || !previousLog) continue; // Should not happen, but a good guard.

		const dayDifference = Math.round(
			(currentLog.targetDate.getTime() - previousLog.targetDate.getTime()) /
				(1000 * 60 * 60 * 24),
		);

		if (dayDifference === 1) {
			// The streak continues.
			currentStreak.endDate = currentLog.targetDate;
			currentStreak.length++;
		} else if (dayDifference > 1) {
			// A gap of more than one day breaks the streak.
			streaks.push(currentStreak);
			// Start a new streak.
			currentStreak = {
				startDate: currentLog.targetDate,
				endDate: currentLog.targetDate,
				length: 1,
			};
		}
		// If dayDifference is 0 or less, logs are for the same day; ignore.
	}

	// Add the last active streak to the list.
	streaks.push(currentStreak);

	return streaks;
}

/**
 * Recalculates and updates all streak records for a given habit.
 * This function is designed to be called whenever a habit's logs change.
 * TODO: implement other frequency type calculations, currently only 'daily' is supported.
 *
 * @param habitId The UUID of the habit to update.
 * @param userId The UUID of the user who owns the habit.
 */
export async function updateStreak(
	habitId: string,
	userId: string,
): Promise<{ success: boolean }> {
	const habit = await db.query.habits.findFirst({
		where: and(eq(schema.habits.id, habitId), eq(schema.habits.userId, userId)),
		with: {
			frequencies: { orderBy: desc(schema.frequencies.activeFrom), limit: 1 },
		},
	});

	if (!habit) {
		console.error(`Habit with ID ${habitId} not found for user ${userId}.`);
		return { success: false };
	}

	const frequency = habit.frequencies[0];
	if (!frequency || frequency.type !== "daily") {
		console.log(
			`Streak calculation for frequency type '${frequency?.type}' on habit ${habitId} is not yet implemented.`,
		);
		return { success: true }; // Not an error, just not handled yet.
	}

	const logs = await db.query.habitLogs.findMany({
		where: eq(schema.habitLogs.habitId, habitId),
		orderBy: asc(schema.habitLogs.targetDate),
	});

	const calculatedStreaks = calculateDailyStreaks(logs);
	if (calculatedStreaks.length === 0) {
		// If no streaks are found, ensure any existing records are wiped.
		await db
			.delete(schema.habitStreaks)
			.where(eq(schema.habitStreaks.habitId, habitId));
		return { success: true };
	}

	const finalStreaksToInsert = calculatedStreaks.map((streak, index) => {
		let finalEndDate: Date | null = streak.endDate;

		// Check if the latest streak is still active.
		if (index === calculatedStreaks.length - 1) {
			const today = new Date();
			today.setUTCHours(0, 0, 0, 0);
			const dayDifference = Math.round(
				(today.getTime() - streak.endDate.getTime()) / (1000 * 60 * 60 * 24),
			);

			// A streak is considered active if its last completion was today or yesterday.
			if (dayDifference <= 1) {
				finalEndDate = null; // Use NULL to indicate the currently active streak.
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

	// Perform a full reconciliation in a single transaction.
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

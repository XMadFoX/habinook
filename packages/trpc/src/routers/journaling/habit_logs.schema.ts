import { habitLogs } from "@habinook/db/features/habit-tracking/habit_logs.schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const createHabitLogSchema = createInsertSchema(habitLogs, {
	habitId: z.uuid(),
	targetDate: z.date(),
	targetTimeSlot: z
		.string()
		.regex(/^\d{2}:\d{2}$/)
		.optional()
		.nullable(),
});

export const updateHabitLogSchema = createUpdateSchema(habitLogs, {
	id: z.uuid(),
	targetDate: z.date().optional(),
	targetTimeSlot: z
		.string()
		.regex(/^\d{2}:\d{2}$/)
		.optional()
		.nullable(),
});

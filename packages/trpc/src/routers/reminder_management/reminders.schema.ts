import { z } from "zod";

export const createReminderSchema = z.object({
	habitId: z.string().uuid(),
	timeOfDay: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
	days: z.array(z.number().int().min(0).max(6)).optional().nullable(),
	customMessage: z.string().optional().nullable(),
});

export const updateReminderSchema = z.object({
	id: z.string().uuid(),
	habitId: z.string().uuid().optional(),
	timeOfDay: z
		.string()
		.regex(/^\d{2}:\d{2}$/)
		.optional(),
	days: z.array(z.number().int().min(0).max(6)).optional().nullable(),
	customMessage: z.string().optional().nullable(),
	isActive: z.boolean().optional(),
});

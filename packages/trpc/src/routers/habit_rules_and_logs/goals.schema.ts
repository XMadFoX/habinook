import { z } from "zod";

export const createGoalSchema = z.object({
	habitId: z.string().uuid(),
	type: z.literal("target").or(z.literal("limit")), // narrowed in router via enum
	value: z.coerce.string(), // Drizzle's decimal type expects a string
	unit: z.string().optional(),
	activeFrom: z
		.string()
		.datetime()
		.transform((val) => new Date(val)), // Parse string to Date for `mode: 'date'`
});

export const updateGoalSchema = z.object({
	id: z.string().uuid(),
	habitId: z.string().uuid().optional(),
	type: z.literal("target").or(z.literal("limit")).optional(), // narrowed in router via enum
	value: z.coerce.string().optional(), // Coerce to string for decimal type
	unit: z.string().optional(),
	activeFrom: z
		.string()
		.datetime()
		.optional()
		.transform((val) => (val ? new Date(val) : undefined)), // Parse string to Date
	activeUntil: z
		.string()
		.datetime()
		.optional()
		.nullable()
		.transform((val) => (val ? new Date(val) : null)), // Parse string to Date or null
});

import { db } from "@habinook/db";
import {
	frequencies,
	frequencyTypeEnum,
} from "@habinook/db/features/habit-tracking/frequencies.schema";
import { habits } from "@habinook/db/features/habit-tracking/habits.schema"; // Import habits schema for joins
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

// Input schema for creating a frequency
export const baseFrequencyConfigSchema = z.object({
	times: z.array(z.string().regex(/^\d{2}:\d{2}$/)).optional(), // HH:MM format
	completionToleranceMinutes: z.number().int().min(0).optional(),
	timezoneId: z.string().optional(), // New field for IANA timezone ID
});

export const dailyConfigSchema = baseFrequencyConfigSchema;

export const daysOfWeekConfigSchema = baseFrequencyConfigSchema.extend({
	days: z.array(z.number().int().min(0).max(6)),
});

export const timesPerPeriodConfigSchema = baseFrequencyConfigSchema.extend({
	count: z.number().int().min(1),
	period: z.enum(["day", "week", "month", "year"]),
});

export const everyXPeriodConfigSchema = baseFrequencyConfigSchema.extend({
	interval: z.number().int().min(1),
	period: z.enum(["day", "week", "month", "year"]),
});

// Input schema for creating a frequency using discriminated union
export const createFrequencySchema = z.discriminatedUnion("type", [
	z.object({
		habitId: z.string().uuid(),
		type: z.literal("daily"),
		config: dailyConfigSchema,
		activeFrom: z
			.string()
			.datetime()
			.transform((val) => new Date(val)),
	}),
	z.object({
		habitId: z.string().uuid(),
		type: z.literal("days_of_week"),
		config: daysOfWeekConfigSchema,
		activeFrom: z
			.string()
			.datetime()
			.transform((val) => new Date(val)),
	}),
	z.object({
		habitId: z.string().uuid(),
		type: z.literal("times_per_period"),
		config: timesPerPeriodConfigSchema,
		activeFrom: z
			.string()
			.datetime()
			.transform((val) => new Date(val)),
	}),
	z.object({
		habitId: z.string().uuid(),
		type: z.literal("every_x_period"),
		config: everyXPeriodConfigSchema,
		activeFrom: z
			.string()
			.datetime()
			.transform((val) => new Date(val)),
	}),
]);

// Input schema for updating a frequency with conditional config validation
export const updateFrequencySchema = z
	.object({
		id: z.string().uuid(),
		habitId: z.string().uuid().optional(),
		type: z.enum(frequencyTypeEnum.enumValues).optional(),
		config: z
			.union([
				dailyConfigSchema,
				daysOfWeekConfigSchema,
				timesPerPeriodConfigSchema,
				everyXPeriodConfigSchema,
			])
			.optional(),
		activeFrom: z
			.string()
			.datetime()
			.optional()
			.transform((val) => (val ? new Date(val) : undefined)),
		activeUntil: z
			.string()
			.datetime()
			.optional()
			.nullable()
			.transform((val) => (val ? new Date(val) : null)),
	})
	.superRefine((data, ctx) => {
		// If type is provided, config must match that type
		if (data.type && data.config) {
			let schemaToUse: z.ZodSchema<any>;
			switch (data.type) {
				case "daily":
					schemaToUse = dailyConfigSchema;
					break;
				case "days_of_week":
					schemaToUse = daysOfWeekConfigSchema;
					break;
				case "times_per_period":
					schemaToUse = timesPerPeriodConfigSchema;
					break;
				case "every_x_period":
					schemaToUse = everyXPeriodConfigSchema;
					break;
				default:
					// Should not happen if type is correctly enum-checked
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: `Unknown frequency type: ${data.type}`,
						path: ["type"],
					});
					return;
			}
			try {
				schemaToUse.parse(data.config);
			} catch (_e) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Invalid config for type '${data.type}'`,
					path: ["config"],
				});
			}
		}
	});

export const frequenciesRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createFrequencySchema)
		.mutation(async ({ ctx, input }) => {
			// Ensure habit belongs to user
			const habit = await db.query.habits.findFirst({
				where: and(
					eq(habits.id, input.habitId),
					eq(habits.userId, ctx.user.id),
				),
			});

			if (!habit) {
				throw new Error("Habit not found or unauthorized");
			}

			const newFrequency = await db
				.insert(frequencies)
				.values({
					habitId: input.habitId,
					type: input.type,
					config: input.config,
					activeFrom: input.activeFrom,
				})
				.returning();
			return newFrequency[0];
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			// Ensure frequency's habit belongs to user
			const frequency = await db.query.frequencies.findFirst({
				where: eq(frequencies.id, input.id),
				with: {
					habit: true,
				},
			});

			if (!frequency || frequency.habit.userId !== ctx.user.id) {
				throw new Error("Frequency not found or unauthorized");
			}
			return frequency;
		}),

	getAllByHabit: protectedProcedure
		.input(z.object({ habitId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			// Ensure habit belongs to user
			const habit = await db.query.habits.findFirst({
				where: and(
					eq(habits.id, input.habitId),
					eq(habits.userId, ctx.user.id),
				),
			});

			if (!habit) {
				throw new Error("Habit not found or unauthorized");
			}

			return db.query.frequencies.findMany({
				where: eq(frequencies.habitId, input.habitId),
			});
		}),

	update: protectedProcedure
		.input(updateFrequencySchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Ensure frequency's habit belongs to user
			const existingFrequency = await db.query.frequencies.findFirst({
				where: eq(frequencies.id, id),
				with: {
					habit: true,
				},
			});

			if (
				!existingFrequency ||
				existingFrequency.habit.userId !== ctx.user.id
			) {
				throw new Error("Frequency not found or unauthorized");
			}

			const updatedFrequency = await db
				.update(frequencies)
				.set(data)
				.where(eq(frequencies.id, id))
				.returning();

			if (!updatedFrequency[0]) {
				throw new Error("Failed to update frequency");
			}
			return updatedFrequency[0];
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			// Ensure frequency's habit belongs to user
			const frequencyToDelete = await db.query.frequencies.findFirst({
				where: eq(frequencies.id, input.id),
				with: {
					habit: true,
				},
			});

			if (
				!frequencyToDelete ||
				frequencyToDelete.habit.userId !== ctx.user.id
			) {
				throw new Error("Frequency not found or unauthorized");
			}

			await db.delete(frequencies).where(eq(frequencies.id, input.id));
			return { success: true };
		}),
});

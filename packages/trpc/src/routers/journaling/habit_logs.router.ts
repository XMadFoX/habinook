import { db } from "@habinook/db";
import {
	habitLogs,
	habitStatusEnum,
} from "@habinook/db/features/habit-tracking/habit_logs.schema";
import { habits } from "@habinook/db/features/habit-tracking/habits.schema"; // Import habits schema for joins
import { and, asc, desc, eq, gte, lte } from "drizzle-orm"; // Import gte and lte
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

// Input schema for creating a habit log
export const createHabitLogSchema = z.object({
	habitId: z.string().uuid(),
	targetDate: z.date(), // Expect Date object directly
	status: z.enum(habitStatusEnum.enumValues),
	completedValue: z
		.number()
		.optional()
		.nullable()
		.transform((val) =>
			val !== undefined && val !== null ? String(val) : null,
		), // decimal expects string
	notes: z.string().optional().nullable(),
});

// Input schema for updating a habit log
export const updateHabitLogSchema = z.object({
	id: z.string().uuid(),
	targetDate: z.date().optional(), // Expect Date object directly
	status: z.enum(habitStatusEnum.enumValues).optional(),
	completedValue: z
		.number()
		.optional()
		.nullable()
		.transform((val) =>
			val !== undefined && val !== null ? String(val) : null,
		),
	notes: z.string().optional().nullable(),
});

export const habitLogsRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createHabitLogSchema)
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

			const newHabitLog = await db
				.insert(habitLogs)
				.values({
					habitId: input.habitId,
					userId: ctx.user.id,
					targetDate: input.targetDate,
					loggedAt: new Date(),
					status: input.status,
					completedValue: input.completedValue,
					notes: input.notes,
				})
				.returning();

			// TODO: Update habit's current_streak and longest_streak here

			return newHabitLog[0];
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			// Ensure habit log's habit belongs to user
			const habitLog = await db.query.habitLogs.findFirst({
				where: eq(habitLogs.id, input.id),
				with: {
					habit: true,
				},
			});

			if (!habitLog || habitLog.habit.userId !== ctx.user.id) {
				throw new Error("Habit log not found or unauthorized");
			}
			return habitLog;
		}),

	getAllForHabit: protectedProcedure
		.input(
			z.object({ habitId: z.string().uuid(), limit: z.number().optional() }),
		)
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

			return db.query.habitLogs.findMany({
				where: eq(habitLogs.habitId, input.habitId),
				orderBy: desc(habitLogs.targetDate),
				limit: input.limit,
			});
		}),

	getAllForDateRange: protectedProcedure
		.input(
			z.object({
				startDate: z.date(),
				endDate: z.date(),
			}),
		)
		.query(async ({ ctx, input }) => {
			return db.query.habitLogs.findMany({
				where: and(
					eq(habitLogs.userId, ctx.user.id),
					and(
						gte(habitLogs.targetDate, input.startDate),
						lte(habitLogs.targetDate, input.endDate),
					),
				),
				orderBy: asc(habitLogs.targetDate),
			});
		}),

	update: protectedProcedure
		.input(updateHabitLogSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Ensure habit log's habit belongs to user
			const existingHabitLog = await db.query.habitLogs.findFirst({
				where: eq(habitLogs.id, id),
				with: {
					habit: true,
				},
			});

			if (!existingHabitLog || existingHabitLog.habit.userId !== ctx.user.id) {
				throw new Error("Habit log not found or unauthorized");
			}

			const updatedHabitLog = await db
				.update(habitLogs)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(habitLogs.id, id))
				.returning();

			if (!updatedHabitLog[0]) {
				throw new Error("Failed to update habit log");
			}

			// TODO: Re-calculate habit's streak if status/targetDate changed

			return updatedHabitLog[0];
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			// Ensure habit log's habit belongs to user
			const habitLogToDelete = await db.query.habitLogs.findFirst({
				where: eq(habitLogs.id, input.id),
				with: {
					habit: true,
				},
			});

			if (!habitLogToDelete || habitLogToDelete.habit.userId !== ctx.user.id) {
				throw new Error("Habit log not found or unauthorized");
			}

			await db.delete(habitLogs).where(eq(habitLogs.id, input.id));

			// TODO: Re-calculate habit's streak

			return { success: true };
		}),
});

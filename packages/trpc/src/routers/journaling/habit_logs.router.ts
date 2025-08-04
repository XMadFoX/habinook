import { db } from "@habinook/db";
import { habitLogs } from "@habinook/db/features/habit-tracking/habit_logs.schema";
import { habits } from "@habinook/db/features/habit-tracking/habits.schema";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { updateStreak } from "../../services/streak.service";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import {
	createHabitLogSchema,
	updateHabitLogSchema,
} from "./habit_logs.schema";

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
					targetTimeSlot: input.targetTimeSlot,
					loggedAt: new Date(),
					status: input.status,
					completedValue: input.completedValue,
					notes: input.notes,
				})
				.returning();

			await updateStreak(input.habitId, ctx.user.id);

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
				where: and(
					eq(habitLogs.habitId, input.habitId),
					eq(habitLogs.userId, ctx.user.id), // Ensure logs belong to the user
				),
				orderBy: [desc(habitLogs.targetDate)],
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
					targetDate: data.targetDate, // Ensure targetDate is updated correctly
					updatedAt: new Date(),
				})
				.where(eq(habitLogs.id, id))
				.returning();

			if (!updatedHabitLog[0]) {
				throw new Error("Failed to update habit log");
			}

			await updateStreak(existingHabitLog.habit.id, ctx.user.id);

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

			await updateStreak(habitLogToDelete.habit.id, ctx.user.id);

			return { success: true };
		}),
});

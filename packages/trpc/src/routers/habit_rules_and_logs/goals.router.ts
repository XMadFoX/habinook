import { db } from "@habinook/db";
import { goals } from "@habinook/db/features/habit-tracking/goals.schema";
import { habits } from "@habinook/db/features/habit-tracking/habits.schema"; // Import habits schema for joins
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { createGoalSchema, updateGoalSchema } from "./goals.schema";

export const goalsRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createGoalSchema)
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

			const newGoal = await db
				.insert(goals)
				.values({
					habitId: input.habitId,
					type: input.type,
					value: input.value,
					unit: input.unit,
					activeFrom: input.activeFrom,
				})
				.returning();
			return newGoal[0];
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			// Ensure goal's habit belongs to user
			const goal = await db.query.goals.findFirst({
				where: eq(goals.id, input.id),
				with: {
					habit: true,
				},
			});

			if (!goal || goal.habit.userId !== ctx.user.id) {
				throw new Error("Goal not found or unauthorized");
			}
			return goal;
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

			return db.query.goals.findMany({
				where: eq(goals.habitId, input.habitId),
			});
		}),

	update: protectedProcedure
		.input(updateGoalSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Ensure goal's habit belongs to user
			const existingGoal = await db.query.goals.findFirst({
				where: eq(goals.id, id),
				with: {
					habit: true,
				},
			});

			if (!existingGoal || existingGoal.habit.userId !== ctx.user.id) {
				throw new Error("Goal not found or unauthorized");
			}

			const updatedGoal = await db
				.update(goals)
				.set(data)
				.where(eq(goals.id, id))
				.returning();

			if (!updatedGoal[0]) {
				throw new Error("Failed to update goal"); // Should not happen if previous checks pass
			}
			return updatedGoal[0];
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			// Ensure goal's habit belongs to user
			const goalToDelete = await db.query.goals.findFirst({
				where: eq(goals.id, input.id),
				with: {
					habit: true,
				},
			});

			if (!goalToDelete || goalToDelete.habit.userId !== ctx.user.id) {
				throw new Error("Goal not found or unauthorized");
			}

			await db.delete(goals).where(eq(goals.id, input.id));
			return { success: true };
		}),
});

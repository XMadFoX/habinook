import { db } from "@habinook/db";
import {
	goals,
	goalTypeEnum,
} from "@habinook/db/features/habit-tracking/goals.schema";
import { habits } from "@habinook/db/features/habit-tracking/habits.schema"; // Import habits schema for joins
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

// Input schema for creating a goal
export const createGoalSchema = z.object({
	habitId: z.string().uuid(),
	type: z.enum(goalTypeEnum.enumValues),
	value: z.coerce.string(), // Drizzle's decimal type expects a string
	unit: z.string().optional(),
	activeFrom: z
		.string()
		.datetime()
		.transform((val) => new Date(val)), // Parse string to Date for `mode: 'date'`
});

// Input schema for updating a goal
export const updateGoalSchema = z.object({
	id: z.string().uuid(),
	habitId: z.string().uuid().optional(),
	type: z.enum(goalTypeEnum.enumValues).optional(),
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

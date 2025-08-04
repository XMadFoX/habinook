import { db } from "@habinook/db";
import { frequencies } from "@habinook/db/features/habit-tracking/frequencies.schema";
import { habits } from "@habinook/db/features/habit-tracking/habits.schema"; // Import habits schema for joins
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import {
	createFrequencySchema,
	updateFrequencySchema,
} from "./frequencies.schema.ts";

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

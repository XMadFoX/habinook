import { db } from "@habinook/db";
import { habits } from "@habinook/db/features/habit-tracking/habits.schema";
import { reminders } from "@habinook/db/features/habit-tracking/reminders.schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { createReminderSchema, updateReminderSchema } from "./reminders.schema";

export const remindersRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createReminderSchema)
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

			const newReminder = await db
				.insert(reminders)
				.values({
					habitId: input.habitId,
					timeOfDay: input.timeOfDay,
					days: input.days ? JSON.stringify(input.days) : null, // Store as JSON string
					customMessage: input.customMessage,
					// isActive defaults to true in schema
				})
				.returning();
			return newReminder[0];
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			// Ensure reminder's habit belongs to user
			const reminder = await db.query.reminders.findFirst({
				where: eq(reminders.id, input.id),
				with: {
					habit: true,
				},
			});

			if (!reminder || reminder.habit.userId !== ctx.user.id) {
				throw new Error("Reminder not found or unauthorized");
			}
			// Parse days back to array if it exists
			if (reminder.days && typeof reminder.days === "string") {
				(reminder.days as unknown as number[]) = JSON.parse(reminder.days);
			}
			return reminder;
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

			const allReminders = await db.query.reminders.findMany({
				where: eq(reminders.habitId, input.habitId),
			});

			// Parse days for all reminders
			return allReminders.map((r) => ({
				...r,
				days:
					r.days && typeof r.days === "string" ? JSON.parse(r.days) : r.days,
			}));
		}),

	update: protectedProcedure
		.input(updateReminderSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, days, ...data } = input;

			// Ensure reminder's habit belongs to user
			const existingReminder = await db.query.reminders.findFirst({
				where: eq(reminders.id, id),
				with: {
					habit: true,
				},
			});

			if (!existingReminder || existingReminder.habit.userId !== ctx.user.id) {
				throw new Error("Reminder not found or unauthorized");
			}

			const updatedReminder = await db
				.update(reminders)
				.set({
					...data,
					days: days ? JSON.stringify(days) : null, // Store as JSON string
					updatedAt: new Date(),
				})
				.where(eq(reminders.id, id))
				.returning();

			if (!updatedReminder[0]) {
				throw new Error("Failed to update reminder");
			}
			// Parse days back to array for the returned object
			if (
				updatedReminder[0].days &&
				typeof updatedReminder[0].days === "string"
			) {
				(updatedReminder[0].days as unknown as number[]) = JSON.parse(
					updatedReminder[0].days,
				);
			}
			return updatedReminder[0];
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			// Ensure reminder's habit belongs to user
			const reminderToDelete = await db.query.reminders.findFirst({
				where: eq(reminders.id, input.id),
				with: {
					habit: true,
				},
			});

			if (!reminderToDelete || reminderToDelete.habit.userId !== ctx.user.id) {
				throw new Error("Reminder not found or unauthorized");
			}

			await db.delete(reminders).where(eq(reminders.id, input.id));
			return { success: true };
		}),
});

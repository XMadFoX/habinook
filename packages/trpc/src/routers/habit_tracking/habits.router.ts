import { DB, db } from "@habinook/db";
import {
	habits,
	habitTypeEnum,
} from "@habinook/db/features/habit-tracking/habits.schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

// Input schema for creating a habit
export const createHabitSchema = z.object({
	name: z.string().min(1, "Habit name cannot be empty."),
	description: z.string().optional(),
	icon: z.string().optional(),
	color: z.string().optional(),
	type: z.enum(habitTypeEnum.enumValues),
	isNegative: z.boolean().default(false),
	why: z.string().optional(),
	startDate: z.date(), // Expect Date object directly
	categoryId: z.string().uuid().optional().nullable(),
});

export const habitsRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createHabitSchema)
		.mutation(async ({ ctx, input }) => {
			const newHabit = await db
				.insert(habits)
				.values({
					name: input.name,
					description: input.description,
					icon: input.icon,
					color: input.color,
					type: input.type,
					isNegative: input.isNegative,
					why: input.why,
					startDate: input.startDate,
					userId: ctx.user.id,
					categoryId: input.categoryId,
				})
				.returning();

			return newHabit[0];
		}),
	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1, "Habit name cannot be empty.").optional(),
				description: z.string().optional(),
				icon: z.string().optional(),
				color: z.string().optional(),
				type: z.enum(habitTypeEnum.enumValues).optional(),
				isNegative: z.boolean().optional(),
				why: z.string().optional(),
				startDate: z.date().optional(), // Expect Date object directly
				categoryId: z.string().uuid().optional().nullable(),
				archivedAt: z.date().optional().nullable(), // Expect Date object or null directly
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const updatedHabit = await db
				.update(habits)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(habits.id, id))
				.returning();

			if (!updatedHabit[0]) {
				throw new Error("Habit not found or unauthorized");
			}
			return updatedHabit[0];
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			// Ensure the habit belongs to the user before deleting
			const habitToDelete = await db.query.habits.findFirst({
				where: eq(habits.id, input.id),
			});

			if (!habitToDelete || habitToDelete.userId !== ctx.user.id) {
				throw new Error("Habit not found or unauthorized");
			}

			await db.delete(habits).where(eq(habits.id, input.id));
			return { success: true };
		}),

	get: protectedProcedure
		.input(z.object({ habitId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const habit = await db.query.habits.findFirst({
				where: eq(habits.id, input.habitId),
			});

			if (!habit || habit.userId !== ctx.user.id) {
				throw new Error("Habit not found or unauthorized");
			}

			return habit;
		}),

	getAll: protectedProcedure.query(async ({ ctx }) => {
		return db.query.habits.findMany({
			where: eq(habits.userId, ctx.user.id),
		});
	}),
});

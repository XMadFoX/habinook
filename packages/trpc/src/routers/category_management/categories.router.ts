import { type DB, db } from "@habinook/db";
import { categories } from "@habinook/db/features/habit-tracking/categories.schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import {
	createCategorySchema,
	updateCategorySchema,
} from "./categories.schema";

export const categoriesRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createCategorySchema)
		.mutation(async ({ ctx, input }) => {
			const newCategory = await db
				.insert(categories)
				.values({
					name: input.name,
					color: input.color,
					userId: ctx.user.id,
				})
				.returning();
			return newCategory[0];
		}),

	getAll: protectedProcedure.query(async ({ ctx }) => {
		return db.query.categories.findMany({
			where: eq(categories.userId, ctx.user.id),
		});
	}),

	update: protectedProcedure
		.input(updateCategorySchema)
		.mutation(async ({ input }) => {
			const { id, ...data } = input;
			const updatedCategory = await (db as DB)
				.update(categories)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(categories.id, id))
				.returning();

			if (!updatedCategory[0]) {
				throw new Error("Category not found or unauthorized");
			}
			return updatedCategory[0];
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const categoryToDelete = await db.query.categories.findFirst({
				where: eq(categories.id, input.id),
			});

			if (!categoryToDelete || categoryToDelete.userId !== ctx.user.id) {
				throw new Error("Category not found or unauthorized");
			}

			await db.delete(categories).where(eq(categories.id, input.id));
			return { success: true };
		}),
});

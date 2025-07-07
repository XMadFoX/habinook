import { type DB, db } from "@habinook/db";
import { categories } from "@habinook/db/features/habit-tracking/categories.schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

// Input schema for creating a category
export const createCategorySchema = z.object({
	name: z.string().min(1, "Category name cannot be empty."),
	color: z.string().optional(),
});

// Input schema for updating a category
export const updateCategorySchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1, "Category name cannot be empty.").optional(),
	color: z.string().optional(),
});

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
		.mutation(async ({ ctx, input }) => {
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

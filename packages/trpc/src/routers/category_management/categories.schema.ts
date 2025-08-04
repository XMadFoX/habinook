import { z } from "zod";

export const createCategorySchema = z.object({
	name: z.string().min(1, "Category name cannot be empty."),
	color: z.string().optional(),
});

export const updateCategorySchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1, "Category name cannot be empty.").optional(),
	color: z.string().optional(),
});

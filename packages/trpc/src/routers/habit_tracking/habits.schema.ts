import { habitTypeEnum } from "@habinook/db/features/habit-tracking/habits.schema";
import { z } from "zod";

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

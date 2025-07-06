import { categoriesRouter } from "./routers/category_management/categories.router";
import { frequenciesRouter } from "./routers/frequency_management/frequencies.router";
import { goalsRouter } from "./routers/habit_rules_and_logs/goals.router";
import { habitsRouter } from "./routers/habit_tracking/habits.router";
import { habitLogsRouter } from "./routers/journaling/habit_logs.router";
import { remindersRouter } from "./routers/reminder_management/reminders.router";
import { createTRPCRouter, publicProcedure } from "./trpc";

export const trpcRouter = createTRPCRouter({
	hello: publicProcedure.query(() => "Hello"),
	habits: habitsRouter,
	categories: categoriesRouter,
	goals: goalsRouter,
	frequencies: frequenciesRouter,
	reminders: remindersRouter,
	habitLogs: habitLogsRouter,
});

export type TrpcRouter = typeof trpcRouter;

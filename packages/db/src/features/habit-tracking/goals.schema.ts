import { relations } from "drizzle-orm";
import {
	date,
	decimal,
	pgEnum,
	pgTable,
	text,
	uuid,
} from "drizzle-orm/pg-core";
import { habits } from "./habits.schema";

export const goalTypeEnum = pgEnum("goal_type", ["target", "limit"]);

export const goals = pgTable("goals", {
	id: uuid("id").defaultRandom().primaryKey(),
	habitId: uuid("habit_id")
		.notNull()
		.references(() => habits.id),
	type: goalTypeEnum("type").notNull(),
	value: decimal("value").notNull(),
	unit: text("unit"),
	activeFrom: date("active_from", { mode: "date" }).notNull(),
	activeUntil: date("active_until", { mode: "date" }),
});

export const goalsRelations = relations(goals, ({ one }) => ({
	habit: one(habits, {
		fields: [goals.habitId],
		references: [habits.id],
	}),
}));

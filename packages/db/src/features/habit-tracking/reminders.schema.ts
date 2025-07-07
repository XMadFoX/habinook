import { relations } from "drizzle-orm";
import {
	boolean,
	pgTable,
	text,
	time,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { habits } from "./habits.schema";

export const reminders = pgTable("reminders", {
	id: uuid("id").defaultRandom().primaryKey(),
	habitId: uuid("habit_id")
		.notNull()
		.references(() => habits.id),
	timeOfDay: time("time_of_day").notNull(),
	days: text("days"), // JSON array of weekdays [0-6] or null for daily,
	customMessage: text("custom_message"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const remindersRelations = relations(reminders, ({ one }) => ({
	habit: one(habits, {
		fields: [reminders.habitId],
		references: [habits.id],
	}),
}));

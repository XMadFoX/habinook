import { relations } from "drizzle-orm";
import {
	date,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "../auth/user.schema";
import { habits } from "./habits.schema";

export const habitStreaks = pgTable("habit_streaks", {
	id: uuid("id").defaultRandom().primaryKey(),
	habitId: uuid("habit_id")
		.notNull()
		.references(() => habits.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	startDate: date("start_date", { mode: "date" }).notNull(),
	endDate: date("end_date", { mode: "date" }), // Null for the currently active streak
	length: integer("length").default(1).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const habitStreaksRelations = relations(habitStreaks, ({ one }) => ({
	habit: one(habits, {
		fields: [habitStreaks.habitId],
		references: [habits.id],
	}),
	user: one(user, {
		fields: [habitStreaks.userId],
		references: [user.id],
	}),
}));

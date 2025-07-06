import { relations } from "drizzle-orm";
import {
	date,
	decimal,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "../auth/user.schema";
import { habits } from "./habits.schema";

export const habitStatusEnum = pgEnum("habit_status", [
	"completed",
	"skipped",
	"missed",
	"partial_completed",
]);

export const habitLogs = pgTable("habit_logs", {
	id: uuid("id").defaultRandom().primaryKey(),
	habitId: uuid("habit_id")
		.notNull()
		.references(() => habits.id),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	targetDate: date("target_date", { mode: "string" }).notNull(),
	loggedAt: timestamp("logged_at").defaultNow().notNull(),
	status: habitStatusEnum("status").notNull(),
	completedValue: decimal("completed_value"),
	notes: text("notes"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
	habit: one(habits, {
		fields: [habitLogs.habitId],
		references: [habits.id],
	}),
	user: one(user, {
		fields: [habitLogs.userId],
		references: [user.id],
	}),
}));

import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "../auth/user.schema";
import { categories } from "./categories.schema";
import { frequencies } from "./frequencies.schema";
import { goals } from "./goals.schema";
import { habitLogs } from "./habit_logs.schema";
import { reminders } from "./reminders.schema";

export const habitTypeEnum = pgEnum("habit_type", [
	"yes_no",
	"measurable",
	"timed",
]);

export const habits = pgTable("habits", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	categoryId: uuid("category_id").references(() => categories.id),
	name: text("name").notNull(),
	description: text("description"),
	icon: text("icon"),
	color: text("color"),
	type: habitTypeEnum("type").notNull(),
	isNegative: boolean("is_negative").default(false).notNull(),
	why: text("why"),
	startDate: date("start_date", { mode: "date" }).notNull(),
	archivedAt: timestamp("archived_at", { mode: "date" }),
	currentStreak: integer("current_streak").default(0).notNull(),
	longestStreak: integer("longest_streak").default(0).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const habitsRelations = relations(habits, ({ one, many }) => ({
	user: one(user, {
		fields: [habits.userId],
		references: [user.id],
	}),
	category: one(categories, {
		fields: [habits.categoryId],
		references: [categories.id],
	}),
	goals: many(goals),
	frequencies: many(frequencies),
	reminders: many(reminders),
	habitLogs: many(habitLogs),
}));

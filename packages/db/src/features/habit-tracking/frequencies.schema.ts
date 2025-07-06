import { relations } from "drizzle-orm";
import { date, jsonb, pgEnum, pgTable, uuid } from "drizzle-orm/pg-core";
import { habits } from "./habits.schema";

export const frequencyTypeEnum = pgEnum("frequency_type", [
	"daily",
	"days_of_week",
	"times_per_period",
	"every_x_period",
]);

export const frequencies = pgTable("frequencies", {
	id: uuid("id").defaultRandom().primaryKey(),
	habitId: uuid("habit_id")
		.notNull()
		.references(() => habits.id),
	type: frequencyTypeEnum("type").notNull(),
	config: jsonb("config").$type<Record<string, unknown>>().notNull(), // e.g., {'days': [1,3,5]} or {'count': 3, 'period': 'week'}
	activeFrom: date("active_from", { mode: "date" }).notNull(),
	activeUntil: date("active_until", { mode: "date" }),
});

export const frequenciesRelations = relations(frequencies, ({ one }) => ({
	habit: one(habits, {
		fields: [frequencies.habitId],
		references: [habits.id],
	}),
}));

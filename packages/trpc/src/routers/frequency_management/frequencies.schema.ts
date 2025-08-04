import { frequencyTypeEnum } from "@habinook/db/features/habit-tracking/frequencies.schema";
import { z } from "zod";

export const baseFrequencyConfigSchema = z.object({
	times: z.array(z.string().regex(/^\d{2}:\d{2}$/)).optional(), // HH:MM format
	completionToleranceMinutes: z.number().int().min(0).optional(),
	timezoneId: z.string().optional(), // New field for IANA timezone ID
});

export const dailyConfigSchema = baseFrequencyConfigSchema;

export const daysOfWeekConfigSchema = baseFrequencyConfigSchema.extend({
	days: z.array(z.number().int().min(0).max(6)),
});

export const timesPerPeriodConfigSchema = baseFrequencyConfigSchema.extend({
	count: z.number().int().min(1),
	period: z.enum(["day", "week", "month", "year"]),
});

export const everyXPeriodConfigSchema = baseFrequencyConfigSchema.extend({
	interval: z.number().int().min(1),
	period: z.enum(["day", "week", "month", "year"]),
});

export const createFrequencySchema = z.discriminatedUnion("type", [
	z.object({
		habitId: z.string().uuid(),
		type: z.literal("daily"),
		config: dailyConfigSchema,
		activeFrom: z
			.string()
			.datetime()
			.transform((val) => new Date(val)),
	}),
	z.object({
		habitId: z.string().uuid(),
		type: z.literal("days_of_week"),
		config: daysOfWeekConfigSchema,
		activeFrom: z
			.string()
			.datetime()
			.transform((val) => new Date(val)),
	}),
	z.object({
		habitId: z.string().uuid(),
		type: z.literal("times_per_period"),
		config: timesPerPeriodConfigSchema,
		activeFrom: z
			.string()
			.datetime()
			.transform((val) => new Date(val)),
	}),
	z.object({
		habitId: z.string().uuid(),
		type: z.literal("every_x_period"),
		config: everyXPeriodConfigSchema,
		activeFrom: z
			.string()
			.datetime()
			.transform((val) => new Date(val)),
	}),
]);
// Input schema for updating a frequency with conditional config validation

export const updateFrequencySchema = z
	.object({
		id: z.string().uuid(),
		habitId: z.string().uuid().optional(),
		type: z.enum(frequencyTypeEnum.enumValues).optional(),
		config: z
			.union([
				dailyConfigSchema,
				daysOfWeekConfigSchema,
				timesPerPeriodConfigSchema,
				everyXPeriodConfigSchema,
			])
			.optional(),
		activeFrom: z
			.string()
			.datetime()
			.optional()
			.transform((val) => (val ? new Date(val) : undefined)),
		activeUntil: z
			.string()
			.datetime()
			.optional()
			.nullable()
			.transform((val) => (val ? new Date(val) : null)),
	})
	.superRefine((data, ctx) => {
		// If type is provided, config must match that type
		if (data.type && data.config) {
			let schemaToUse: z.ZodSchema<
				z.infer<
					| typeof dailyConfigSchema
					| typeof daysOfWeekConfigSchema
					| typeof timesPerPeriodConfigSchema
					| typeof everyXPeriodConfigSchema
				>
			>;
			switch (data.type) {
				case "daily":
					schemaToUse = dailyConfigSchema;
					break;
				case "days_of_week":
					schemaToUse = daysOfWeekConfigSchema;
					break;
				case "times_per_period":
					schemaToUse = timesPerPeriodConfigSchema;
					break;
				case "every_x_period":
					schemaToUse = everyXPeriodConfigSchema;
					break;
				default:
					// Should not happen if type is correctly enum-checked
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: `Unknown frequency type: ${data.type}`,
						path: ["type"],
					});
					return;
			}
			try {
				schemaToUse.parse(data.config);
			} catch (_e: unknown) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Invalid config for type '${data.type}'`,
					path: ["config"],
				});
			}
		}
	});

// TODO: refactor & improvements
// useful: https://tanstack.com/form/latest/docs/framework/react/guides/form-composition
// - [ ] custom fields to use in the children props
// - [ ] define fields as an array & map
// - [ ] color picker
// - [ ] icon picker
// - [ ] category picker
// - [ ] better time selector?

// TODO:: remove after refactor
// biome-ignore-all lint/correctness/noChildrenProp: temporary, will be refactored

import { habitTypeEnum } from "@habinook/db/features/habit-tracking/habits.schema";
import {
	dailyConfigSchema,
	daysOfWeekConfigSchema,
	everyXPeriodConfigSchema,
	timesPerPeriodConfigSchema,
} from "@habinook/trpc/src/routers/frequency_management/frequencies.schema";
import { createHabitSchema } from "@habinook/trpc/src/routers/habit_tracking/habits.schema";
import { Button } from "@habinook/ui/components/button";
import { Checkbox } from "@habinook/ui/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@habinook/ui/components/dialog";
import { Input } from "@habinook/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@habinook/ui/components/select";
import { Separator } from "@habinook/ui/components/separator";
import { useAppForm } from "@habinook/ui/components/tanstack-form";
import { Textarea } from "@habinook/ui/components/textarea";
import { useCallback, useMemo, useState } from "react";
import { z } from "zod";

// Local client-only enum values mirroring server (@habinook/db habit_type)
const habitTypeValues: Readonly<typeof habitTypeEnum.enumValues> =
	habitTypeEnum.enumValues;

// Habit schema (client-side fallback mirroring server shape)
const createHabitFormSchema = createHabitSchema.extend({
	startDate: z.preprocess((v) => {
		if (v instanceof Date) return v;
		if (typeof v === "string" && v) return new Date(v);
		return v as unknown;
	}, z.date()),
});

// Frequency schemas (client-side fallback, omitting habitId)

const frequencyFormSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("daily"),
		config: dailyConfigSchema,
		activeFrom: z.string().datetime(),
	}),
	z.object({
		type: z.literal("days_of_week"),
		config: daysOfWeekConfigSchema,
		activeFrom: z.string().datetime(),
	}),
	z.object({
		type: z.literal("times_per_period"),
		config: timesPerPeriodConfigSchema,
		activeFrom: z.string().datetime(),
	}),
	z.object({
		type: z.literal("every_x_period"),
		config: everyXPeriodConfigSchema,
		activeFrom: z.string().datetime(),
	}),
]);

export type HabitInput = z.infer<typeof createHabitFormSchema>;
export type FrequencyInput = z.infer<typeof frequencyFormSchema>;

const formSchema = z.object({
	habit: createHabitFormSchema,
	frequency: frequencyFormSchema,
});

export interface CreateHabitModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreate: (data: z.input<typeof formSchema>) => Promise<{ habitId: string }>;
	onSuccess?: (payload: { habitId: string }) => void;
}

function formatDateToInput(d: Date) {
	const year = d.getFullYear();
	const month = `${d.getMonth() + 1}`.padStart(2, "0");
	const day = `${d.getDate()}`.padStart(2, "0");
	return `${year}-${month}-${day}`;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function CreateHabitModal(props: CreateHabitModalProps) {
	const tzDefault = useMemo(
		() => Intl.DateTimeFormat().resolvedOptions().timeZone,
		[],
	);
	const nowIso = useMemo(() => new Date().toISOString(), []);

	const [submitError, setSubmitError] = useState<string | null>(null);

	const form = useAppForm({
		validators: { onSubmit: formSchema },
		defaultValues: {
			habit: {
				name: "",
				description: "",
				icon: "",
				color: "",
				type: habitTypeValues[0],
				isNegative: false,
				why: "",
				startDate: new Date(),
				categoryId: null,
			},
			frequency: {
				type: "daily",
				config: {
					times: [],
					completionToleranceMinutes: undefined,
					timezoneId: tzDefault,
				},
				activeFrom: nowIso,
			} as FrequencyInput,
		} as z.input<typeof formSchema>,
		onSubmit: async ({ value }) => {
			setSubmitError(null);
			try {
				const result = await props.onCreate(value);
				props.onSuccess?.(result);
				form.reset({
					habit: {
						name: "",
						description: "",
						icon: "",
						color: "",
						type: habitTypeValues[0],
						isNegative: false,
						why: "",
						startDate: new Date(),
						categoryId: null,
					},
					frequency: {
						type: "daily",
						config: {
							times: [],
							completionToleranceMinutes: undefined,
							timezoneId: tzDefault,
						},
						activeFrom: new Date().toISOString(),
					} as FrequencyInput,
				});
				props.onOpenChange(false);
			} catch (e: unknown) {
				setSubmitError(
					e instanceof Error ? e.message : "Failed to create habit.",
				);
			}
		},
	});

	const isSubmitting = form.state.isSubmitting;
	const freqType = form.getFieldValue("frequency.type");

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			e.stopPropagation();
			form.handleSubmit();
		},
		[form],
	);

	return (
		<Dialog open={props.open} onOpenChange={props.onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Habit</DialogTitle>
				</DialogHeader>

				{/* <form.AppForm> */}
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<section className="flex flex-col gap-3">
						<h3 className="text-sm font-medium">Habit details</h3>

						<form.AppField
							name="habit.name"
							children={(field) => (
								<field.FormItem>
									<field.FormLabel>Name</field.FormLabel>
									<field.FormControl>
										<Input
											placeholder="e.g. Drink water"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
										/>
									</field.FormControl>
									<field.FormMessage />
								</field.FormItem>
							)}
						/>

						<form.AppField
							name="habit.description"
							children={(field) => (
								<field.FormItem>
									<field.FormLabel>Description</field.FormLabel>
									<field.FormControl>
										<Textarea
											placeholder="Optional details"
											value={field.state.value ?? ""}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
										/>
									</field.FormControl>
									<field.FormMessage />
								</field.FormItem>
							)}
						/>

						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<form.AppField
								name="habit.icon"
								children={(field) => (
									<field.FormItem>
										<field.FormLabel>Icon</field.FormLabel>
										<field.FormControl>
											<Input
												placeholder="Optional icon name"
												value={field.state.value ?? ""}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
											/>
										</field.FormControl>
										<field.FormMessage />
									</field.FormItem>
								)}
							/>

							<form.AppField
								name="habit.color"
								children={(field) => (
									<field.FormItem>
										<field.FormLabel>Color</field.FormLabel>
										<field.FormControl>
											<Input
												placeholder="Optional color (hex or token)"
												value={field.state.value ?? ""}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
											/>
										</field.FormControl>
										<field.FormMessage />
									</field.FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<form.AppField
								name="habit.type"
								children={(field) => (
									<field.FormItem>
										<field.FormLabel>Type</field.FormLabel>
										<field.FormControl>
											<Select
												value={field.state.value}
												onValueChange={(v: typeof field.state.value) =>
													field.handleChange(v)
												}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select habit type" />
												</SelectTrigger>
												<SelectContent>
													{habitTypeValues.map((v) => (
														<SelectItem key={v} value={v}>
															{v}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</field.FormControl>
										<field.FormMessage />
									</field.FormItem>
								)}
							/>

							<form.AppField
								name="habit.startDate"
								children={(field) => (
									<field.FormItem>
										<field.FormLabel>Start date</field.FormLabel>
										<field.FormControl>
											<Input
												type="date"
												value={
													field.state.value instanceof Date
														? formatDateToInput(field.state.value)
														: ""
												}
												onChange={(e) => {
													const val = e.target.value;
													field.handleChange(
														val ? new Date(val) : (null as unknown as Date),
													);
												}}
												onBlur={field.handleBlur}
											/>
										</field.FormControl>
										<field.FormMessage />
									</field.FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<form.AppField
								name="habit.isNegative"
								children={(field) => (
									<field.FormItem>
										<field.FormLabel>Is negative?</field.FormLabel>
										<field.FormControl>
											<div className="flex h-9 items-center gap-2">
												<Checkbox
													checked={!!field.state.value}
													onCheckedChange={(v) =>
														field.handleChange(Boolean(v))
													}
												/>
											</div>
										</field.FormControl>
										<field.FormMessage />
									</field.FormItem>
								)}
							/>

							<form.AppField
								name="habit.categoryId"
								children={(field) => (
									<field.FormItem>
										<field.FormLabel>Category ID</field.FormLabel>
										<field.FormControl>
											<Input
												placeholder="Optional category UUID"
												value={field.state.value ?? ""}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
											/>
										</field.FormControl>
										<field.FormMessage />
									</field.FormItem>
								)}
							/>
						</div>

						<form.AppField
							name="habit.why"
							children={(field) => (
								<field.FormItem>
									<field.FormLabel>Why?</field.FormLabel>
									<field.FormControl>
										<Textarea
											placeholder="Optional motivation"
											value={field.state.value ?? ""}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
										/>
									</field.FormControl>
									<field.FormMessage />
								</field.FormItem>
							)}
						/>
					</section>

					<Separator />

					<section className="flex flex-col gap-3">
						<h3 className="text-sm font-medium">Frequency</h3>

						<form.AppField
							name="frequency.type"
							children={(field) => (
								<field.FormItem>
									<field.FormLabel>Type</field.FormLabel>
									<field.FormControl>
										<Select
											value={field.state.value}
											onValueChange={(v) =>
												field.handleChange(v as FrequencyInput["type"])
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select frequency type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="daily">daily</SelectItem>
												<SelectItem value="days_of_week">
													days_of_week
												</SelectItem>
												<SelectItem value="times_per_period">
													times_per_period
												</SelectItem>
												<SelectItem value="every_x_period">
													every_x_period
												</SelectItem>
											</SelectContent>
										</Select>
									</field.FormControl>
									<field.FormMessage />
								</field.FormItem>
							)}
						/>

						{/* Common config fields */}
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
							<form.AppField
								name="frequency.config.timezoneId"
								children={(field) => (
									<field.FormItem>
										<field.FormLabel>Timezone</field.FormLabel>
										<field.FormControl>
											<Input
												placeholder="IANA timezone"
												value={field.state.value ?? ""}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
											/>
										</field.FormControl>
										<field.FormMessage />
									</field.FormItem>
								)}
							/>

							<form.AppField
								name="frequency.config.completionToleranceMinutes"
								children={(field) => (
									<field.FormItem>
										<field.FormLabel>Tolerance (min)</field.FormLabel>
										<field.FormControl>
											<Input
												type="number"
												inputMode="numeric"
												min={0}
												value={field.state.value ?? ""}
												onChange={(e) =>
													field.handleChange(
														e.target.value === ""
															? undefined
															: Number(e.target.value),
													)
												}
												onBlur={field.handleBlur}
											/>
										</field.FormControl>
										<field.FormMessage />
									</field.FormItem>
								)}
							/>
						</div>

						{/* Times array editor */}
						<form.AppField
							name="frequency.config.times"
							children={(field) => (
								<div className="flex flex-col gap-2">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">Times</span>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => field.pushValue("08:00")}
										>
											Add time
										</Button>
									</div>
									<div className="flex flex-col gap-2">
										{field.state.value?.length === 0 ? (
											<p className="text-sm text-muted-foreground">
												No times added
											</p>
										) : null}
										{field.state.value?.map((v, idx) => (
											<form.AppField
												key={`${idx}-${v}`}
												mode="array"
												name={`frequency.config.times[${idx}]`}
												children={(scheduleField) => (
													<div className="flex items-center gap-2">
														<Input
															placeholder="HH:MM"
															value={scheduleField.state.value ?? ""}
															onChange={(e) =>
																scheduleField.handleChange(e.target.value)
															}
															onBlur={scheduleField.handleBlur}
														/>
														<Button
															type="button"
															variant="ghost"
															onClick={() => field.removeValue(idx)}
														>
															Remove
														</Button>
													</div>
												)}
											/>
										))}
									</div>
								</div>
							)}
						/>

						{/* Conditional sections */}
						{freqType === "days_of_week" ? (
							<form.AppField
								name="frequency.config.days"
								children={(field) => (
									<field.FormItem>
										<field.FormLabel>Days of week</field.FormLabel>
										<div className="grid grid-cols-7 gap-2">
											{DAYS.map((label, idx) => {
												const arr: number[] = Array.isArray(field.state.value)
													? field.state.value
													: [];
												const checked = arr.includes(idx);
												return (
													<div
														key={`${idx}-${label}`}
														className="flex flex-col items-center gap-1"
													>
														<Checkbox
															checked={checked}
															onCheckedChange={(v) => {
																const next = new Set(arr);
																if (v) next.add(idx);
																else next.delete(idx);
																field.handleChange(
																	Array.from(next.values()).sort(),
																);
															}}
														/>
														<span className="text-xs">{label}</span>
													</div>
												);
											})}
										</div>
										<field.FormMessage />
									</field.FormItem>
								)}
							/>
						) : null}

						{freqType === "times_per_period" ? (
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<form.AppField
									name="frequency.config.count"
									children={(field) => (
										<field.FormItem>
											<field.FormLabel>Count</field.FormLabel>
											<field.FormControl>
												<Input
													type="number"
													inputMode="numeric"
													min={1}
													value={field.state.value ?? ""}
													onChange={(e) =>
														field.handleChange(Number(e.target.value))
													}
													onBlur={field.handleBlur}
												/>
											</field.FormControl>
											<field.FormMessage />
										</field.FormItem>
									)}
								/>
								<form.AppField
									name="frequency.config.period"
									children={(field) => (
										<field.FormItem>
											<field.FormLabel>Period</field.FormLabel>
											<field.FormControl>
												<Select
													value={field.state.value ?? ""}
													onValueChange={(v: typeof field.state.value) =>
														field.handleChange(v)
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select period" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="day">day</SelectItem>
														<SelectItem value="week">week</SelectItem>
														<SelectItem value="month">month</SelectItem>
														<SelectItem value="year">year</SelectItem>
													</SelectContent>
												</Select>
											</field.FormControl>
											<field.FormMessage />
										</field.FormItem>
									)}
								/>
							</div>
						) : null}

						{freqType === "every_x_period" ? (
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<form.AppField
									name="frequency.config.interval"
									children={(field) => (
										<field.FormItem>
											<field.FormLabel>Interval</field.FormLabel>
											<field.FormControl>
												<Input
													type="number"
													inputMode="numeric"
													min={1}
													value={field.state.value ?? ""}
													onChange={(e) =>
														field.handleChange(Number(e.target.value))
													}
													onBlur={field.handleBlur}
												/>
											</field.FormControl>
											<field.FormMessage />
										</field.FormItem>
									)}
								/>
								<form.AppField
									name="frequency.config.period"
									children={(field) => (
										<field.FormItem>
											<field.FormLabel>Period</field.FormLabel>
											<field.FormControl>
												<Select
													value={field.state.value ?? ""}
													onValueChange={(v: typeof field.state.value) =>
														field.handleChange(v)
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select period" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="day">day</SelectItem>
														<SelectItem value="week">week</SelectItem>
														<SelectItem value="month">month</SelectItem>
														<SelectItem value="year">year</SelectItem>
													</SelectContent>
												</Select>
											</field.FormControl>
											<field.FormMessage />
										</field.FormItem>
									)}
								/>
							</div>
						) : null}
					</section>

					{submitError ? (
						<div className="text-sm text-destructive">{submitError}</div>
					) : null}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => props.onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</form>
				{/* </form.AppForm> */}
			</DialogContent>
		</Dialog>
	);
}

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@habinook/ui/components/accordion";
import { Badge } from "@habinook/ui/components/badge";
import { Button } from "@habinook/ui/components/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@habinook/ui/components/card";
import { Progress } from "@habinook/ui/components/progress";
import { format } from "date-fns";

// TODO: infer
// Interface for period units - copied from index.tsx as it's needed for Frequency type
export type Period = "day" | "week" | "month" | "year";

// Base configuration for all frequency types - copied from index.tsx
export interface BaseFrequencyConfig {
	times?: string[];
	completionToleranceMinutes?: number;
	timezoneId?: string;
}

// Specific frequency configs - copied from index.tsx
export interface DailyConfig extends BaseFrequencyConfig {}
export interface DaysOfWeekConfig extends BaseFrequencyConfig {
	days: number[];
}
export interface TimesPerPeriodConfig extends BaseFrequencyConfig {
	count: number;
	period: Period;
}
export interface EveryXPeriodConfig extends BaseFrequencyConfig {
	interval: number;
	period: Period;
}

// Union type for all frequency configurations - copied from index.tsx
export type FrequencyConfig =
	| DailyConfig
	| DaysOfWeekConfig
	| TimesPerPeriodConfig
	| EveryXPeriodConfig;

// Main Frequency type matching backend schema - copied from index.tsx
export type Frequency = {
	id: string;
	habitId: string;
	type: "daily" | "days_of_week" | "times_per_period" | "every_x_period";
	config: FrequencyConfig;
	activeFrom: Date;
	activeUntil: Date | null;
};

// Habit type - copied from index.tsx
export type Habit = {
	id: string;
	name: string;
	description: string | null;
	type: "yes_no" | "measurable" | "timed";
	isNegative: boolean;
	color: string | null;
	icon: string | null;
	startDate: Date;
	currentStreak?: number;
	longestStreak?: number;
	frequencies: Frequency[] | null;
};

export type HabitLog = {
	id: string;
	habitId: string;
	targetDate: string;
	status: "completed" | "skipped" | "missed" | "partial_completed";
	loggedAt: string;
};

interface TodayScreenProps {
	now: Date;
	loadingHabits: boolean;
	dueToday: Habit[];
	completedToday: Habit[];
	skippedToday: Habit[];
	totalCount: number;
	doneCount: number;
	progress: number;
	formatFrequency: (freq: Frequency) => string;
	completeHabit: (habitId: string) => void;
	skipHabit: (habitId: string) => void;
}

export function TodayScreen({
	now,
	loadingHabits,
	dueToday,
	completedToday,
	skippedToday,
	totalCount,
	doneCount,
	progress,
	formatFrequency,
	completeHabit,
	skipHabit,
}: TodayScreenProps) {
	return (
		<div className="mx-auto w-full max-w-4xl p-6 space-y-6">
			<TodayHeader
				now={now}
				totalCount={totalCount}
				doneCount={doneCount}
				progress={progress}
			/>
			<DueTodaySection
				loadingHabits={loadingHabits}
				dueToday={dueToday}
				formatFrequency={formatFrequency}
				completeHabit={completeHabit}
				skipHabit={skipHabit}
			/>
			<CompletedSkippedSection
				completedToday={completedToday}
				skippedToday={skippedToday}
			/>
		</div>
	);
}

interface TodayHeaderProps {
	now: Date;
	totalCount: number;
	doneCount: number;
	progress: number;
}

function TodayHeader({
	now,
	totalCount,
	doneCount,
	progress,
}: TodayHeaderProps) {
	return (
		<header className="flex items-center justify-between">
			<div>
				<h1 className="text-2xl font-semibold">Today</h1>
				<p className="text-muted-foreground">{format(now, "EEEE, MMM d")}</p>
			</div>
			<div className="min-w-40">
				<div className="flex items-center justify-between text-sm mb-1">
					<span className="text-muted-foreground">Progress</span>
					<span className="font-medium">
						{doneCount}/{totalCount}
					</span>
				</div>
				<Progress value={progress} />
			</div>
		</header>
	);
}

interface DueTodaySectionProps {
	loadingHabits: boolean;
	dueToday: Habit[];
	formatFrequency: (freq: Frequency) => string;
	completeHabit: (habitId: string) => void;
	skipHabit: (habitId: string) => void;
}

function DueTodaySection({
	loadingHabits,
	dueToday,
	formatFrequency,
	completeHabit,
	skipHabit,
}: DueTodaySectionProps) {
	return (
		<section className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Due Today</h2>
				<Badge variant={dueToday.length ? "secondary" : "outline"}>
					{dueToday.length}
				</Badge>
			</div>
			{loadingHabits ? (
				<Card>
					<CardHeader>
						<CardTitle className="animate-pulse h-5 w-40 bg-muted rounded" />
						<CardDescription className="animate-pulse h-4 w-64 bg-muted rounded" />
					</CardHeader>
					<CardContent className="grid gap-3">
						<div className="animate-pulse h-4 w-full bg-muted rounded" />
						<div className="animate-pulse h-4 w-3/4 bg-muted rounded" />
					</CardContent>
					<CardFooter className="justify-end">
						<div className="animate-pulse h-9 w-24 bg-muted rounded-md" />
					</CardFooter>
				</Card>
			) : dueToday.length === 0 ? (
				<Card className="flex items-center justify-center">
					<CardHeader className="max-w-md text-center w-full">
						<CardTitle className="text-balance">All done for today</CardTitle>
						<CardDescription className="text-pretty">
							You have no pending habits. Enjoy your day 🎉
						</CardDescription>
					</CardHeader>
				</Card>
			) : (
				<div className="grid gap-4">
					{dueToday.map((habit) => (
						<DueHabitCard
							key={habit.id}
							habit={habit}
							formatFrequency={formatFrequency}
							completeHabit={completeHabit}
							skipHabit={skipHabit}
						/>
					))}
				</div>
			)}
		</section>
	);
}

interface DueHabitCardProps {
	habit: Habit;
	formatFrequency: (freq: Frequency) => string;
	completeHabit: (habitId: string) => void;
	skipHabit: (habitId: string) => void;
}

function DueHabitCard({
	habit,
	formatFrequency,
	completeHabit,
	skipHabit,
}: DueHabitCardProps) {
	const freqs = habit.frequencies ?? [];
	return (
		<Card key={habit.id}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{habit.icon ? <span className="text-xl">{habit.icon}</span> : null}
					<span>{habit.name}</span>
					{habit.isNegative ? <Badge variant="destructive">Avoid</Badge> : null}
				</CardTitle>
				<CardDescription className="flex flex-wrap gap-2">
					{freqs.map((f) => (
						<Badge key={f.id} variant="outline">
							{formatFrequency(f)}
						</Badge>
					))}
				</CardDescription>
				<CardAction>
					<Badge variant="secondary">
						Streak {habit.currentStreak ?? 0} • Best {habit.longestStreak ?? 0}
					</Badge>
				</CardAction>
			</CardHeader>
			{habit.description ? (
				<CardContent>
					<p className="text-sm text-muted-foreground">{habit.description}</p>
				</CardContent>
			) : null}
			<CardFooter className="gap-2 justify-end">
				<Button variant="outline" onClick={() => skipHabit(habit.id)}>
					Skip
				</Button>
				<Button onClick={() => completeHabit(habit.id)}>Complete</Button>
			</CardFooter>
		</Card>
	);
}

interface CompletedSkippedSectionProps {
	completedToday: Habit[];
	skippedToday: Habit[];
}

function CompletedSkippedSection({
	completedToday,
	skippedToday,
}: CompletedSkippedSectionProps) {
	return (
		<section className="space-y-2">
			<Accordion type="single" collapsible defaultValue="completed">
				<AccordionItem value="completed">
					<AccordionTrigger>
						<div className="flex items-center gap-2">
							<h3 className="text-base font-semibold">Completed Today</h3>
							<Badge variant={completedToday.length ? "secondary" : "outline"}>
								{completedToday.length}
							</Badge>
						</div>
					</AccordionTrigger>
					<AccordionContent>
						{completedToday.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No completed habits yet.
							</p>
						) : (
							<div className="grid gap-3">
								{completedToday.map((habit) => (
									<LoggedHabitCard
										key={habit.id}
										habit={habit}
										status="completed"
									/>
								))}
							</div>
						)}
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="skipped">
					<AccordionTrigger>
						<div className="flex items-center gap-2">
							<h3 className="text-base font-semibold">Skipped Today</h3>
							<Badge variant={skippedToday.length ? "secondary" : "outline"}>
								{skippedToday.length}
							</Badge>
						</div>
					</AccordionTrigger>
					<AccordionContent>
						{skippedToday.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No skipped habits.
							</p>
						) : (
							<div className="grid gap-3">
								{skippedToday.map((habit) => (
									<LoggedHabitCard
										key={habit.id}
										habit={habit}
										status="skipped"
									/>
								))}
							</div>
						)}
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</section>
	);
}

interface LoggedHabitCardProps {
	habit: Habit;
	status: "completed" | "skipped";
}

function LoggedHabitCard({ habit, status }: LoggedHabitCardProps) {
	const borderColor =
		status === "completed" ? "border-green-500/30" : "border-yellow-500/30";
	const statusBadge =
		status === "completed" ? (
			<Badge>Completed</Badge>
		) : (
			<Badge variant="outline">Skipped</Badge>
		);

	return (
		<Card className={borderColor}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{habit.icon ? <span className="text-xl">{habit.icon}</span> : null}
					<span>{habit.name}</span>
					{statusBadge}
				</CardTitle>
				<CardAction>
					<Badge variant="secondary">Streak {habit.currentStreak ?? 0}</Badge>
				</CardAction>
			</CardHeader>
		</Card>
	);
}

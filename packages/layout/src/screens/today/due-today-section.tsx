import { Badge } from "@habinook/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@habinook/ui/components/card";
import { DueHabitCard } from "./due-habit-card";
import type { Frequency, Habit, TimeInstance } from "./types";

interface DueTodaySectionProps {
	loadingHabits: boolean;
	dueToday: Habit[];
	formatFrequency: (freq: Frequency) => string;
	completeHabit: (habitId: string, targetTimeSlot?: string) => void;
	skipHabit: (habitId: string, targetTimeSlot?: string) => void;
	timeInstancesByHabit?: Map<string, TimeInstance[]>;
}

export function DueTodaySection({
	loadingHabits,
	dueToday,
	formatFrequency,
	completeHabit,
	skipHabit,
	timeInstancesByHabit,
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
					{dueToday.map((habit) => {
						const instances = timeInstancesByHabit?.get(habit.id);
						const pendingCount =
							instances?.filter((i) => i.status === "pending").length ?? 0;
						return (
							<div key={habit.id} className="space-y-2">
								{instances && instances.length > 0 ? (
									<div className="flex items-center justify-between px-1">
										<span className="text-xs text-muted-foreground">
											{pendingCount} {pendingCount === 1 ? "time" : "times"}{" "}
											remaining today
										</span>
									</div>
								) : null}
								<DueHabitCard
									habit={habit}
									formatFrequency={formatFrequency}
									completeHabit={completeHabit}
									skipHabit={skipHabit}
									timeInstances={instances}
								/>
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
}

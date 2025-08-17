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
import type { Frequency, Habit, TimeInstance } from "./types";

interface DueHabitCardProps {
	habit: Habit;
	formatFrequency: (freq: Frequency) => string;
	completeHabit: (habitId: string, targetTimeSlot?: string) => void;
	skipHabit: (habitId: string, targetTimeSlot?: string) => void;
	timeInstances?: TimeInstance[];
}

export function DueHabitCard({
	habit,
	formatFrequency,
	completeHabit,
	skipHabit,
	timeInstances,
}: DueHabitCardProps) {
	const freqs = habit.frequencies ?? [];
	const hasTimedSlots = (timeInstances?.length ?? 0) > 0;
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
			{hasTimedSlots && timeInstances ? (
				<CardContent className="grid gap-2">
					{timeInstances.map((ti) => {
						const isCompleted = ti.status === "completed";
						const isSkipped = ti.status === "skipped";
						const disabled = isCompleted || isSkipped;
						return (
							<div
								key={ti.time}
								className="group flex items-center justify-between rounded-lg border p-2 transition-colors hover:bg-muted/40"
							>
								<div className="flex items-center gap-2">
									<Button asChild size="sm">
										<Badge
											className="h-8 px-3 rounded-full text-sm flex items-center"
											variant={
												isCompleted
													? "secondary"
													: isSkipped
														? "outline"
														: "default"
											}
										>
											{ti.time}
										</Badge>
									</Button>
									{isCompleted ? <Badge>Done</Badge> : null}
									{isSkipped ? <Badge variant="outline">Skipped</Badge> : null}
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										className="opacity-90 group-hover:opacity-100"
										disabled={disabled}
										onClick={() => skipHabit(habit.id, ti.time)}
									>
										Skip
									</Button>
									<Button
										size="sm"
										className="opacity-90 group-hover:opacity-100"
										disabled={disabled}
										onClick={() => completeHabit(habit.id, ti.time)}
									>
										Complete
									</Button>
								</div>
							</div>
						);
					})}
				</CardContent>
			) : null}
			{!hasTimedSlots ? (
				<CardFooter className="gap-2 justify-end">
					<Button variant="outline" onClick={() => skipHabit(habit.id)}>
						Skip
					</Button>
					<Button onClick={() => completeHabit(habit.id)}>Complete</Button>
				</CardFooter>
			) : null}
		</Card>
	);
}

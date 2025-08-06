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
import type { Frequency, Habit } from "./types";

interface DueHabitCardProps {
	habit: Habit;
	formatFrequency: (freq: Frequency) => string;
	completeHabit: (habitId: string) => void;
	skipHabit: (habitId: string) => void;
}

export function DueHabitCard({
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

import { Badge } from "@habinook/ui/components/badge";
import {
	Card,
	CardAction,
	CardHeader,
	CardTitle,
} from "@habinook/ui/components/card";
import type { Habit } from "./types";

interface LoggedHabitCardProps {
	habit: Habit;
	status: "completed" | "skipped";
}

export function LoggedHabitCard({ habit, status }: LoggedHabitCardProps) {
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

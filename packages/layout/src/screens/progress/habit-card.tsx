import type { RouterOutput } from "@habinook/trpc";
import { Card, CardContent, CardHeader } from "@habinook/ui/components/card";
import { format } from "date-fns";
import { HabitHeader } from "./habit-header";
import { HabitTimeline } from "./habit-timeline";
import type { ProgressScreenProps } from "./types";

type SelectHabit = RouterOutput["habits"]["getAll"][0];

export function HabitCard({
	habit,
	dates,
	instancesByHabitDate,
	toggleInstance,
}: {
	habit: SelectHabit;
	dates: Date[];
	instancesByHabitDate: ProgressScreenProps["instancesByHabitDate"];
	toggleInstance: ProgressScreenProps["toggleInstance"];
}) {
	let total = 0;
	let completed = 0;
	for (const date of dates) {
		const dateStr = format(date, "yyyy-MM-dd");
		const dateInstances =
			instancesByHabitDate.get(habit.id)?.get(dateStr) ?? [];
		for (const inst of dateInstances) {
			if (inst.status !== "not_due") {
				total++;
				if (inst.status === "completed") completed++;
			}
		}
	}
	const habitPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

	return (
		<Card className="overflow-hidden">
			<CardHeader className="py-3 px-4">
				<HabitHeader
					habit={habit}
					habitPercent={habitPercent}
					currentStreak={habit.currentStreak}
				/>
			</CardHeader>

			<CardContent className="pt-2 px-4 pb-4">
				<HabitTimeline
					habit={habit}
					dates={dates}
					instancesByHabitDate={instancesByHabitDate}
					toggleInstance={toggleInstance}
				/>
			</CardContent>
		</Card>
	);
}

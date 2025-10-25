import { addDays, endOfDay, startOfDay } from "date-fns";
import { useMemo } from "react";
import { HabitCard } from "./habit-card";
import { OverallProgress } from "./overall-progress";
import type { ProgressScreenProps } from "./types";

export function ProgressScreen({
	habits,
	instancesByHabitDate,
	toggleInstance,
	dateRange,
	overallProgress: propProgress,
}: ProgressScreenProps) {
	const [start, end] = dateRange;

	const dates = useMemo(() => {
		const arr: Date[] = [];
		let current = startOfDay(start);
		const endDay = endOfDay(end);
		while (current <= endDay) {
			arr.push(new Date(current));
			current = addDays(current, 1);
		}
		return arr;
	}, [start, end]);

	const overallProgress = useMemo(() => {
		if (propProgress !== undefined) return propProgress;
		let total = 0;
		let completed = 0;
		for (const habit of habits) {
			const habitMap = instancesByHabitDate.get(habit.id);
			if (!habitMap) continue;
			for (const dateMap of habitMap.values()) {
				for (const inst of dateMap) {
					if (inst.status !== "not_due") {
						total++;
						if (inst.status === "completed") completed++;
					}
				}
			}
		}
		return total > 0 ? Math.round((completed / total) * 100) : 0;
	}, [habits, instancesByHabitDate, propProgress]);

	return (
		<div className="mx-auto w-full max-w-6xl p-6 space-y-6">
			<OverallProgress overallProgress={overallProgress} />

			<div className="space-y-4">
				{habits.map((habit) => (
					<HabitCard
						key={habit.id}
						habit={habit}
						dates={dates}
						instancesByHabitDate={instancesByHabitDate}
						toggleInstance={toggleInstance}
					/>
				))}
			</div>
		</div>
	);
}

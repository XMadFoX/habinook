import type { RouterOutput } from "@habinook/trpc";
import { DayCell } from "./day-cell";
import type { ProgressScreenProps } from "./types";

type SelectHabit = RouterOutput["habits"]["getAll"][0];

export function HabitTimeline({
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
	return (
		<div className="overflow-x-auto -mx-2 px-2">
			<div
				className="inline-grid"
				style={{
					gridTemplateColumns: `repeat(${dates.length}, minmax(56px, 1fr))`,
					gap: 10,
				}}
			>
				{dates.map((date) => (
					<DayCell
						key={date.toISOString()}
						date={date}
						habitId={habit.id}
						instancesByHabitDate={instancesByHabitDate}
						toggleInstance={toggleInstance}
					/>
				))}
			</div>
		</div>
	);
}

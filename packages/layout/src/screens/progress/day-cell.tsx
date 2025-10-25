import { format } from "date-fns";
import { InstanceButton } from "./instance-button";
import type { ProgressScreenProps } from "./types";

export function DayCell({
	date,
	habitId,
	instancesByHabitDate,
	toggleInstance,
}: {
	date: Date;
	habitId: string;
	instancesByHabitDate: ProgressScreenProps["instancesByHabitDate"];
	toggleInstance: ProgressScreenProps["toggleInstance"];
}) {
	const dateStr = format(date, "yyyy-MM-dd");
	const dateInstances = instancesByHabitDate.get(habitId)?.get(dateStr) ?? [];

	return (
		<div className="flex flex-col items-center gap-2 px-1">
			<div className="text-xs text-muted-foreground text-center">
				{format(date, "EEE")}
			</div>
			<div className="text-sm font-medium">{format(date, "d")}</div>

			<div className="flex flex-col items-center gap-2">
				{dateInstances.length === 0 ? (
					<div className="text-muted-foreground text-xs">—</div>
				) : (
					dateInstances.map((inst, idx) => (
						<InstanceButton
							key={inst.timeSlot ?? `single-${idx}`}
							inst={inst}
							habitId={habitId}
							date={date}
							timeSlot={inst.timeSlot}
							toggleInstance={toggleInstance}
						/>
					))
				)}
			</div>
		</div>
	);
}

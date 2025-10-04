import { Badge } from "@habinook/ui/components/badge";
import { Progress } from "@habinook/ui/components/progress";
import type { Habit } from "../today/types";

export function HabitHeader({
	habit,
	habitPercent,
	currentStreak,
}: {
	habit: Habit;
	habitPercent: number;
	currentStreak: number | null;
}) {
	return (
		<div className="w-full flex items-center justify-between gap-4">
			<div className="flex items-center gap-4 min-w-0">
				<div className="flex items-center justify-center w-11 h-11 rounded-lg bg-muted/40 text-xl shrink-0">
					{habit.icon}
				</div>

				<div className="min-w-0">
					<div className="flex items-center gap-3">
						<h3 className="font-semibold truncate">{habit.name}</h3>

						{habit.frequencies?.length ? (
							<div className="flex items-center gap-2">
								{habit.frequencies.map((f) => (
									<Badge
										key={f.id}
										variant="outline"
										className="text-xs h-6 px-2 rounded-full"
									>
										{f.type}
									</Badge>
								))}
							</div>
						) : null}
					</div>

					{habit.description ? (
						<div className="text-sm text-muted-foreground truncate mt-1">
							{habit.description}
						</div>
					) : null}
				</div>
			</div>

			<div className="flex items-center gap-4">
				<div className="text-sm text-muted-foreground">Streak</div>
				<div className="text-sm font-semibold">{currentStreak ?? 0}</div>

				<div className="flex items-center gap-3">
					<div className="w-36">
						<Progress value={habitPercent} />
					</div>
					<div className="text-sm font-semibold w-10 text-right">
						{habitPercent}%
					</div>
				</div>
			</div>
		</div>
	);
}

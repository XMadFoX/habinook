import { Progress } from "@habinook/ui/components/progress";
import { format } from "date-fns";

interface TodayHeaderProps {
	now: Date;
	totalCount: number;
	doneCount: number;
	progress: number;
}

export function TodayHeader({
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

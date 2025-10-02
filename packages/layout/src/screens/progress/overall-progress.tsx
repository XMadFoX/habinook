import { Card, CardContent, CardHeader } from "@habinook/ui/components/card";
import { Progress } from "@habinook/ui/components/progress";

export function OverallProgress({
	overallProgress,
}: {
	overallProgress: number;
}) {
	return (
		<Card>
			<CardHeader className="mb-2 text-sm text-muted-foreground">
				Overall completion
			</CardHeader>
			<CardContent className="flex items-center gap-4">
				<div className="w-full">
					<Progress className="w-full" value={overallProgress} />
				</div>
				<div className="text-sm font-semibold">{overallProgress}%</div>
			</CardContent>
		</Card>
	);
}

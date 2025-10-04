import { cn } from "@habinook/ui/lib/utils";
import { format } from "date-fns";
import { match } from "ts-pattern";
import type { Instance, ProgressScreenProps } from "./types";

export function InstanceButton({
	inst,
	habitId,
	date,
	timeSlot,
	toggleInstance,
}: {
	inst: Instance;
	habitId: string;
	date: Date;
	timeSlot?: string;
	toggleInstance: ProgressScreenProps["toggleInstance"];
}) {
	const isCompleted = inst.status === "completed";
	const isSkipped = inst.status === "skipped";
	const isNotDue = inst.status === "not_due";

	const base =
		"h-8 w-8 flex items-center justify-center rounded-full transition-transform hover:scale-105 text-sm font-semibold border";

	const statusClass = match(inst.status)
		.with(
			"completed",
			() =>
				"bg-primary/70 text-primary-foreground border border-primary/30 hover:bg-primary/80",
		)
		.with(
			"missed",
			() =>
				"bg-destructive/12 text-destructive border border-destructive/30 hover:bg-destructive/16",
		)
		.with(
			"skipped",
			() => "bg-muted/10 text-muted-foreground border border-muted/30",
		)
		.with(
			"pending",
			() => "bg-transparent text-muted-foreground border border-transparent",
		)
		.with(
			"not_due",
			() => "bg-transparent text-muted-foreground border border-transparent",
		)
		.exhaustive();

	const content = match(inst.status)
		.with("completed", () => "✓")
		.with("missed", () => "!")
		.with("skipped", () => "—")
		.with("pending", () => "•")
		.with("not_due", () => "—")
		.exhaustive();

	return (
		<button
			type="button"
			aria-label={`Toggle instance ${timeSlot ?? ""} on ${format(date, "yyyy-MM-dd")}`}
			onClick={() => toggleInstance(habitId, date, !isCompleted, timeSlot)}
			disabled={isNotDue || isSkipped}
			title={timeSlot ?? undefined}
			className={cn(
				base,
				statusClass,
				isNotDue || isSkipped
					? "opacity-60 cursor-not-allowed"
					: "cursor-pointer",
			)}
		>
			{content}
		</button>
	);
}

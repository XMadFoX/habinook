import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@habinook/ui/components/accordion";
import { Badge } from "@habinook/ui/components/badge";
import { LoggedHabitCard } from "./logged-habit-card";
import type { Habit, TimeInstance } from "./types";

interface CompletedSkippedSectionProps {
	completedToday: Habit[];
	skippedToday: Habit[];
	timeInstancesByHabit?: Map<string, TimeInstance[]>;
}

export function CompletedSkippedSection({
	completedToday,
	skippedToday,
	timeInstancesByHabit,
}: CompletedSkippedSectionProps) {
	return (
		<section className="space-y-2">
			<Accordion type="single" collapsible defaultValue="completed">
				<AccordionItem value="completed">
					<AccordionTrigger>
						<div className="flex items-center gap-2">
							<h3 className="text-base font-semibold">Completed Today</h3>
							<Badge variant={completedToday.length ? "secondary" : "outline"}>
								{completedToday.length}
							</Badge>
						</div>
					</AccordionTrigger>
					<AccordionContent>
						{completedToday.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No completed habits yet.
							</p>
						) : (
							<div className="grid gap-3">
								{completedToday.map((habit) => (
									<LoggedHabitCard
										key={habit.id}
										habit={habit}
										status="completed"
										timeInstances={timeInstancesByHabit?.get(habit.id)}
									/>
								))}
							</div>
						)}
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="skipped">
					<AccordionTrigger>
						<div className="flex items-center gap-2">
							<h3 className="text-base font-semibold">Skipped Today</h3>
							<Badge variant={skippedToday.length ? "secondary" : "outline"}>
								{skippedToday.length}
							</Badge>
						</div>
					</AccordionTrigger>
					<AccordionContent>
						{skippedToday.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No skipped habits.
							</p>
						) : (
							<div className="grid gap-3">
								{skippedToday.map((habit) => (
									<LoggedHabitCard
										key={habit.id}
										habit={habit}
										status="skipped"
										timeInstances={timeInstancesByHabit?.get(habit.id)}
									/>
								))}
							</div>
						)}
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</section>
	);
}

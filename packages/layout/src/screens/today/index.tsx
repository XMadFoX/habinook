import { CompletedSkippedSection } from "./completed-skipped-section";
import { DueTodaySection } from "./due-today-section";
import { TodayHeader } from "./today-header";
import type { TodayScreenProps } from "./types";

export function TodayScreen({
	now,
	loadingHabits,
	dueToday,
	completedToday,
	skippedToday,
	totalCount,
	doneCount,
	progress,
	formatFrequency,
	completeHabit,
	skipHabit,
	timeInstancesByHabit,
}: TodayScreenProps) {
	return (
		<div className="mx-auto w-full max-w-4xl p-6 space-y-6">
			<TodayHeader
				now={now}
				totalCount={totalCount}
				doneCount={doneCount}
				progress={progress}
			/>
			<DueTodaySection
				loadingHabits={loadingHabits}
				dueToday={dueToday}
				formatFrequency={formatFrequency}
				completeHabit={completeHabit}
				skipHabit={skipHabit}
				timeInstancesByHabit={timeInstancesByHabit}
			/>
			<CompletedSkippedSection
				completedToday={completedToday}
				skippedToday={skippedToday}
				timeInstancesByHabit={timeInstancesByHabit}
			/>
		</div>
	);
}

import { ProgressScreen } from "@habinook/layout/src/screens/progress";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { addDays, endOfDay, format, startOfDay, subDays } from "date-fns";
import { useCallback, useMemo } from "react";
import { useSession } from "../lib/auth";
import { trpc } from "../trpc";
import { getInstancesByHabitDate } from "../utils/instanceUtils";
import { getLogsByKey } from "../utils/logUtils";

export const Route = createFileRoute("/progress")({
	component: ProgressRoute,
});

function ProgressRoute() {
	const qc = useQueryClient();
	const { data: userData } = useSession();

	const now = new Date();
	const start = subDays(now, 30); // Last 30 days
	const end = now;
	// const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	const { data: habits, isLoading: loadingHabits } = useQuery({
		...trpc.habits.getAll.queryOptions(),
	});

	const { data: logs = [] } = useQuery({
		...trpc.habitLogs.getAllForDateRange.queryOptions({
			startDate: startOfDay(start),
			endDate: endOfDay(end),
		}),
	});

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

	const createMutation = useMutation({
		...trpc.habitLogs.create.mutationOptions(),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: trpc.habits.getAll.queryKey() });
			qc.invalidateQueries({
				queryKey: trpc.habitLogs.getAllForDateRange.queryKey({
					startDate: start,
					endDate: end,
				}),
			});
		},
	});

	const updateMutation = useMutation({
		...trpc.habitLogs.update.mutationOptions(),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: trpc.habits.getAll.queryKey() });
			qc.invalidateQueries({
				queryKey: trpc.habitLogs.getAllForDateRange.queryKey({
					startDate: start,
					endDate: end,
				}),
			});
		},
	});

	const logsByKey = useMemo(() => getLogsByKey(logs), [logs]);

	const instancesByHabitDate = useMemo(
		() => getInstancesByHabitDate(habits, logsByKey, dates, now),
		[habits, logsByKey, dates, now],
	);

	const toggleInstance = useCallback(
		(habitId: string, date: Date, checked: boolean, timeSlot?: string) => {
			console.log("toggleInstance", habitId, date, timeSlot, checked);
			if (!userData?.user.id) return;

			const dateStr = format(date, "yyyy-MM-dd");
			const key = `${habitId}-${dateStr}-${timeSlot || "single"}`;
			const existingLog = logsByKey.get(key);

			if (checked) {
				// Complete
				if (existingLog) {
					if (existingLog.status !== "completed") {
						updateMutation.mutate({
							id: existingLog.id,
							status: "completed",
						});
					}
				} else {
					createMutation.mutate({
						habitId,
						userId: userData.user.id,
						targetDate: date,
						targetTimeSlot: timeSlot,
						status: "completed",
					});
				}
			} else {
				// Uncheck - set to missed or delete
				if (existingLog) {
					if (
						existingLog.status === "completed" ||
						existingLog.status === "skipped"
					) {
						// Update to missed
						updateMutation.mutate({
							id: existingLog.id,
							status: "missed",
						});
					}
				}
			}
		},
		[logsByKey, userData, createMutation, updateMutation],
	);

	if (loadingHabits) {
		return <div>Loading...</div>;
	}

	return (
		<ProgressScreen
			habits={habits || []}
			instancesByHabitDate={instancesByHabitDate}
			toggleInstance={toggleInstance}
			dateRange={[start, end]}
		/>
	);
}

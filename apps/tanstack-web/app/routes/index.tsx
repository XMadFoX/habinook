import {
	BaseFrequencyConfig,
	DailyConfig,
	type DaysOfWeekConfig,
	type EveryXPeriodConfig,
	type Frequency,
	FrequencyConfig,
	Habit,
	type HabitLog,
	Period,
	type TimesPerPeriodConfig,
	TodayScreen as TodayScreenUI,
} from "@habinook/layout/src/today-screen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { endOfDay, getDay, isAfter, isBefore, startOfDay } from "date-fns";
import { useCallback, useMemo } from "react";
import { useSession } from "../lib/auth";
import { useTRPC } from "../trpc";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	const trpc = useTRPC();
	const qc = useQueryClient();

	const { data: habits, isLoading: loadingHabits } = useQuery({
		...trpc.habits.getAll.queryOptions(),
	});

	const now = new Date();
	const start = startOfDay(now);
	const end = endOfDay(now);

	type LogRow = {
		habitId: string;
		status: HabitLog["status"];
	};

	const { data: todaysLogs } = useQuery({
		...trpc.habitLogs.getAllForDateRange.queryOptions({
			startDate: start,
			endDate: end,
		}),
	});

	const createLog = useMutation({
		...trpc.habitLogs.create.mutationOptions(),
		onSuccess: async () => {
			await Promise.all([
				qc.invalidateQueries({
					queryKey: trpc.habitLogs.getAllForDateRange.queryKey({
						startDate: start,
						endDate: end,
					}),
				}),
				qc.invalidateQueries({ queryKey: trpc.habits.getAll.queryKey() }),
			]);
		},
	});

	const user = useSession();

	const completeHabit = (habitId: string) => {
		return createLog.mutate({
			userId: user.data?.user.id ?? "1",
			habitId,
			targetDate: new Date(),
			status: "completed",
		});
	};

	const skipHabit = (habitId: string) => {
		return createLog.mutate({
			userId: user.data?.user.id ?? "1",
			habitId,
			targetDate: new Date(),
			status: "skipped",
		});
	};

	// Helper functions used by the UI component
	function formatFrequency(freq: Frequency): string {
		switch (freq.type) {
			case "daily":
				return "Every day";
			case "days_of_week": {
				const config = freq.config as DaysOfWeekConfig;
				return `On ${config.days.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")}`;
			}
			case "times_per_period": {
				const config = freq.config as TimesPerPeriodConfig;
				return `${config.count}× per ${config.period}`;
			}
			case "every_x_period": {
				const config = freq.config as EveryXPeriodConfig;
				const base = startOfDay(freq.activeFrom);
				const diffDays = Math.floor(
					(startOfDay(now).getTime() - base.getTime()) / (1000 * 60 * 60 * 24),
				);
				if (config.period === "day") {
					return `${diffDays % config.interval === 0}`;
				}
				const factor =
					config.period === "week" ? 7 : config.period === "month" ? 30 : 365;
				return `${diffDays % (config.interval * factor) === 0}`;
			}
			default:
				return "";
		}
	}

	const isActiveOnDate = useCallback((freq: Frequency, date: Date): boolean => {
		const activeFrom = new Date(freq.activeFrom);
		const activeUntil = freq.activeUntil ? new Date(freq.activeUntil) : null;
		if (isBefore(date, startOfDay(activeFrom))) return false;
		if (activeUntil && isAfter(date, endOfDay(activeUntil))) return false;
		return true;
	}, []);

	const isDueTodayByFrequency = useCallback(
		(freq: Frequency, date: Date): boolean => {
			if (!isActiveOnDate(freq, date)) return false;

			switch (freq.type) {
				case "daily":
					return true;
				case "days_of_week": {
					const config = freq.config as DaysOfWeekConfig;
					const dow = getDay(date);
					return (config.days ?? []).includes(dow);
				}
				case "every_x_period": {
					const config = freq.config as EveryXPeriodConfig;
					const base = startOfDay(freq.activeFrom);
					const diffDays = Math.floor(
						(startOfDay(date).getTime() - base.getTime()) /
							(1000 * 60 * 60 * 24),
					);
					if (config.period === "day") {
						return diffDays % config.interval === 0;
					}
					const factor =
						config.period === "week" ? 7 : config.period === "month" ? 30 : 365;
					return diffDays % (config.interval * factor) === 0;
				}
				case "times_per_period": {
					return true;
				}
				default:
					return false; // Added default return
			}
		},
		[isActiveOnDate],
	);

	const logsByHabitId = useMemo(() => {
		const map = new Map<string, LogRow[]>();
		for (const log of (todaysLogs ?? []) as LogRow[]) {
			const arr = map.get(log.habitId) ?? [];
			arr.push(log);
			map.set(log.habitId, arr);
		}
		return map;
	}, [todaysLogs]);

	const dueToday = useMemo(() => {
		if (!habits) return [];
		return habits.filter((h) => {
			const todayLogs = logsByHabitId.get(h.id) ?? [];
			const hasTerminalStatus = todayLogs.some(
				(l) => l.status === "completed" || l.status === "skipped",
			);
			if (hasTerminalStatus) return false;

			const freqs = h.frequencies ?? [];
			if (!freqs.length) return false;
			return freqs.some((f) => isDueTodayByFrequency(f, now));
		});
	}, [habits, logsByHabitId, now, isDueTodayByFrequency]);

	const completedToday = useMemo(() => {
		if (!habits) return [];
		const byId = new Set(
			(todaysLogs ?? [])
				.filter((l: LogRow) => l.status === "completed")
				.map((l: LogRow) => l.habitId),
		);
		return habits.filter((h) => byId.has(h.id));
	}, [habits, todaysLogs]);

	const skippedToday = useMemo(() => {
		if (!habits) return [];
		const byId = new Set(
			(todaysLogs ?? [])
				.filter((l: LogRow) => l.status === "skipped")
				.map((l: LogRow) => l.habitId),
		);
		return habits.filter((h) => byId.has(h.id));
	}, [habits, todaysLogs]);

	const totalCount = habits?.length ?? 0;
	const doneCount = completedToday.length;
	const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

	return (
		<TodayScreenUI
			now={now}
			loadingHabits={loadingHabits}
			dueToday={dueToday}
			completedToday={completedToday}
			skippedToday={skippedToday}
			totalCount={totalCount}
			doneCount={doneCount}
			progress={progress}
			formatFrequency={formatFrequency}
			completeHabit={completeHabit}
			skipHabit={skipHabit}
		/>
	);
}

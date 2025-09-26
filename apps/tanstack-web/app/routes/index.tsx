import { TZDate } from "@date-fns/tz";
import { TodayScreen as TodayScreenUI } from "@habinook/layout/src/screens/today";
import type {
	DaysOfWeekConfig,
	EveryXPeriodConfig,
	Frequency,
	HabitLog,
	TimesPerPeriodConfig,
} from "@habinook/layout/src/screens/today/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	addMinutes,
	endOfDay,
	format,
	getDay,
	isAfter,
	isBefore,
	isWithinInterval,
	startOfDay,
	subMinutes,
} from "date-fns";
import { useCallback, useMemo } from "react";
import { useSession } from "../lib/auth";
import { trpc } from "../trpc";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	const qc = useQueryClient();

	const { data: habits, isLoading: loadingHabits } = useQuery({
		...trpc.habits.getAll.queryOptions(),
	});

	const now = new Date();
	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const todayInTimezone = new TZDate(now.getTime(), timezone);
	const start = startOfDay(todayInTimezone);
	const end = endOfDay(todayInTimezone);

	type LogRow = Pick<HabitLog, "habitId" | "status" | "targetTimeSlot">;

	// timezone helper removed (was unused) — timezone is resolved per-frequency where required

	const { data: todaysLogs } = useQuery({
		...trpc.habitLogs.getAllForDateRange.queryOptions({
			startDate: new Date(
				Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()),
			),
			endDate: new Date(
				Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()),
			),
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

	const completeHabit = (habitId: string, targetTimeSlot?: string) => {
		return createLog.mutate({
			userId: user.data?.user.id ?? "1",
			habitId,
			targetDate: new Date(
				Date.UTC(
					todayInTimezone.getFullYear(),
					todayInTimezone.getMonth(),
					todayInTimezone.getDate(),
				),
			),
			targetTimeSlot,
			status: "completed",
		});
	};

	const skipHabit = (habitId: string, targetTimeSlot?: string) => {
		return createLog.mutate({
			userId: user.data?.user.id ?? "1",
			habitId,
			targetDate: new Date(
				Date.UTC(
					todayInTimezone.getFullYear(),
					todayInTimezone.getMonth(),
					todayInTimezone.getDate(),
				),
			),
			targetTimeSlot,
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

	// Build per-time-slot instances grouped by habit
	type TimeInstance = {
		habitId: string;
		time: string; // "HH:MM"
		status: "completed" | "skipped" | "pending";
		state?: "past" | "now" | "upcoming";
	};
	const timeInstancesByHabit = useMemo(() => {
		const byHabit = new Map<string, TimeInstance[]>();
		if (!habits) return byHabit;

		for (const h of habits) {
			const freqs = h.frequencies ?? [];
			const todayRelevantFreqs = freqs.filter((f) =>
				isDueTodayByFrequency(f, now),
			);
			// collect unique times and keep the originating freq/config to compute timezone/tolerance
			const timesMap = new Map<string, { freq: Frequency; cfg: any }>();
			for (const f of todayRelevantFreqs) {
				const cfg: any = f.config ?? {};
				const times: string[] = Array.isArray(cfg.times) ? cfg.times : [];
				for (const t of times) {
					if (!timesMap.has(t)) timesMap.set(t, { freq: f, cfg });
				}
			}
			if (timesMap.size === 0) continue;

			const todayLogs = logsByHabitId.get(h.id) ?? [];
			const slotStatus = new Map<string, "completed" | "skipped">();
			for (const log of todayLogs) {
				if (!log.targetTimeSlot) continue;
				if (log.status === "completed" || log.status === "skipped") {
					// keep the first terminal status per slot
					if (!slotStatus.has(log.targetTimeSlot)) {
						slotStatus.set(log.targetTimeSlot, log.status);
					}
				}
			}

			const arr: TimeInstance[] = [];
			for (const t of Array.from(timesMap.keys()).sort()) {
				const { cfg } = timesMap.get(t)!;
				const st = slotStatus.get(t) ?? "pending";

				// Determine timezone-aware state for UI (past / now / upcoming)
				const tz =
					(cfg?.timezoneId as string) ??
					Intl.DateTimeFormat().resolvedOptions().timeZone;
				const tolerance = (cfg?.completionToleranceMinutes as number) ?? 30;

				// Use the zoned date for 'today' in the target timezone
				const dateStr = format(new TZDate(now.getTime(), tz), "yyyy-MM-dd");

				let scheduledUtc: Date;
				try {
					// construct an ISO-like string and convert from zoned to UTC
					// scheduledUtc = dfstz.zonedTimeToUtc(`${dateStr}T${t}:00`, tz);
					scheduledUtc = new TZDate(`${dateStr}T${t}:00`, tz);
				} catch (_e) {
					// fallback to browser timezone if parse/conversion fails
					scheduledUtc = new TZDate(
						`${dateStr}T${t}:00`,
						Intl.DateTimeFormat().resolvedOptions().timeZone,
					);
				}

				const lower = subMinutes(scheduledUtc, tolerance);
				const upper = addMinutes(scheduledUtc, tolerance);

				let state: "past" | "now" | "upcoming" = "upcoming";
				if (isWithinInterval(now, { start: lower, end: upper })) {
					state = "now";
				} else if (isAfter(now, upper)) {
					state = "past";
				} else {
					state = "upcoming";
				}

				arr.push({ habitId: h.id, time: t, status: st, state });
			}
			if (arr.length) {
				byHabit.set(h.id, arr);
			}
		}
		return byHabit;
	}, [habits, logsByHabitId, now, isDueTodayByFrequency]);

	// A habit is due today if it has any frequency active today AND
	// - it has time slots: at least one pending slot remains
	// - or it is untimed and has no terminal log
	const dueToday = useMemo(() => {
		if (!habits) return [];
		return habits.filter((h) => {
			const freqs = h.frequencies ?? [];
			if (!freqs.length) return false;
			const anyActive = freqs.some((f) => isDueTodayByFrequency(f, now));
			if (!anyActive) return false;

			const timedSlots = timeInstancesByHabit.get(h.id) ?? [];
			if (timedSlots.length > 0) {
				return timedSlots.some((s) => s.status === "pending");
			}

			// Untimed fallback: original behavior
			const todayLogs = logsByHabitId.get(h.id) ?? [];
			const hasTerminalStatus = todayLogs.some(
				(l) => l.status === "completed" || l.status === "skipped",
			);
			return !hasTerminalStatus;
		});
	}, [habits, logsByHabitId, now, isDueTodayByFrequency, timeInstancesByHabit]);

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
			timeInstancesByHabit={timeInstancesByHabit}
		/>
	);
}

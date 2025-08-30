import type {
	FrequencyInput,
	HabitInput,
} from "@habinook/layout/src/modals/habit/create";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTRPC } from "../trpc";

export function useCreateHabit() {
	const [open, setOpen] = useState(false);

	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const createHabitMutation = useMutation({
		...trpc.habits.create.mutationOptions(),
	});
	const createFrequencyMutation = useMutation({
		...trpc.frequencies.create.mutationOptions(),
	});

	const onCreateHabit = async (data: {
		habit: HabitInput;
		frequency: FrequencyInput;
	}) => {
		const h = await createHabitMutation.mutateAsync(data.habit);
		await createFrequencyMutation.mutateAsync({
			...data.frequency,
			habitId: h.id,
		});
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: trpc.habits.getAll.queryKey(),
			}),
			queryClient.invalidateQueries({
				queryKey: trpc.frequencies.getAllByHabit.queryKey({
					habitId: h.id,
				}),
			}),
		]);
		return { habitId: h.id };
	};

	return {
		open,
		setOpen,
		onCreateHabit,
	};
}

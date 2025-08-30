import { CreateHabitModal } from "@habinook/layout/src/modals/habit/create";
import { Button } from "@habinook/ui/components/button";
import { useCreateHabit } from "../hooks/use-create-habit";

export function CreateHabitButton() {
	const { open, setOpen, onCreateHabit } = useCreateHabit();

	return (
		<>
			<Button onClick={() => setOpen(true)}>Create habit</Button>
			<CreateHabitModal
				open={open}
				onOpenChange={setOpen}
				onCreate={onCreateHabit}
			/>
		</>
	);
}

import Navbar from "@habinook/ui/components/navbar";
import { Link } from "@tanstack/react-router";
import { signOut, useSession } from "../lib/auth";
import { CreateHabitButton } from "./create-habit-button";

export function Header() {
	const session = useSession();

	return (
		<header className="px-4 md:px-6">
			{session.data?.user ? (
				<Navbar
					user={session.data.user}
					onSignOut={() => signOut()}
					createHabitComponent={<CreateHabitButton />}
				/>
			) : (
				<div className="flex h-16 items-center justify-end gap-4">
					<Link
						to={"/auth/$pathname"}
						params={{ pathname: "sign-in" }}
						className="text-sm font-medium"
					>
						Sign In
					</Link>
					<Link
						to={"/auth/$pathname"}
						params={{ pathname: "sign-up" }}
						className="text-sm font-medium"
					>
						Get Started
					</Link>
				</div>
			)}
		</header>
	);
}

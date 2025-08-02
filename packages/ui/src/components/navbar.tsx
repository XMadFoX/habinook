import { Avatar, AvatarFallback } from "@/components/avatar";
import { Button } from "@/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "@/components/navigation-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";

// Navigation links array to be used in both desktop and mobile menus
const navigationLinks = [
	{ href: "/", label: "Today", active: true },
	{ href: "/progress", label: "Progress" },
];

export default function Navbar({
	user,
	onSignOut,
}: {
	user: {
		id: string;
		name: string;
		emailVerified: boolean;
		email: string;
		createdAt: Date;
		updatedAt: Date;
		image?: string | null | undefined;
	};
	onSignOut: () => void;
}) {
	return (
		<header className="border-b px-4 md:px-6">
			<div className="flex h-16 items-center justify-between gap-4">
				{/* Left side */}
				<div className="flex items-center gap-2">
					{/* Mobile menu trigger */}
					<Popover>
						<PopoverTrigger asChild>
							<Button
								className="group size-8 md:hidden"
								variant="ghost"
								size="icon"
							>
								<MenuIcon />
							</Button>
						</PopoverTrigger>
						<PopoverContent align="start" className="w-36 p-1 md:hidden">
							<NavigationMenu className="max-w-none *:w-full">
								<NavigationMenuList className="flex-col items-start gap-0 md:gap-2">
									{navigationLinks.map((link, index) => (
										<NavigationMenuItem
											key={`${link.href}-${index}`}
											className="w-full"
										>
											<NavigationMenuLink
												href={link.href}
												className="py-1.5"
												active={link.active}
											>
												{link.label}
											</NavigationMenuLink>
										</NavigationMenuItem>
									))}
								</NavigationMenuList>
							</NavigationMenu>
						</PopoverContent>
					</Popover>
					{/* Main nav */}
					<div className="flex items-center gap-6">
						{/* TODO: logo */}
						{/* Navigation menu */}
						<NavigationMenu className="max-md:hidden">
							<NavigationMenuList className="gap-2">
								{navigationLinks.map((link, index) => (
									<NavigationMenuItem key={`${link.href}-${index}`}>
										<NavigationMenuLink
											active={link.active}
											href={link.href}
											className="text-muted-foreground hover:text-primary py-1.5 font-medium"
										>
											{link.label}
										</NavigationMenuLink>
									</NavigationMenuItem>
								))}
							</NavigationMenuList>
						</NavigationMenu>
					</div>
				</div>
				{/* Right side */}
				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="relative h-8 w-8 rounded-full">
								<Avatar className="h-8 w-8">
									{/* <AvatarImage src={user.image} alt={user.name} /> */}
									<AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
								</Avatar>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-56" align="end" forceMount>
							<DropdownMenuLabel className="font-normal">
								<div className="flex flex-col space-y-1">
									<p className="text-sm font-medium leading-none">
										{user.name}
									</p>
									<p className="text-muted-foreground text-xs leading-none">
										{user.email}
									</p>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={onSignOut}>Sign out</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
function MenuIcon() {
	return (
		<svg
			className="pointer-events-none"
			width={16}
			height={16}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="Menu"
		>
			<title>Menu</title>
			<path
				d="M4 12L20 12"
				className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
			/>
			<path
				d="M4 12H20"
				className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
			/>
			<path
				d="M4 12H20"
				className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
			/>
		</svg>
	);
}

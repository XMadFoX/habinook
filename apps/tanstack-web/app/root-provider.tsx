import { AuthUIProviderTanstack } from "@daveyplate/better-auth-ui/tanstack";
import { Toaster } from "@habinook/ui/components/sonner";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { RegisteredRouter } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { authClient } from "./lib/auth";

export function TrpcProvider({
	children,
	router,
}: {
	children: React.ReactNode;
	router: RegisteredRouter;
}) {
	return (
		<>
			<AuthUIProviderTanstack
				authClient={authClient}
				navigate={(href) => router.navigate({ href })}
				replace={(href) => router.navigate({ href, replace: true })}
				Link={({ href, ...props }) => <Link to={href} {...props} />}
			>
				{children}
			</AuthUIProviderTanstack>
			<Toaster />
			<ReactQueryDevtools initialIsOpen={false} />
		</>
	);
}

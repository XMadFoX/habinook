import { AuthUIProviderTanstack } from "@daveyplate/better-auth-ui/tanstack";
import { Toaster } from "@habinook/ui/components/sonner";
import type { RegisteredRouter } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { authClient } from "./lib/auth";
import { queryClient, TRPCProvider, trpcClient } from "./trpc";

export function TrpcProvider({
	children,
	router,
}: {
	children: React.ReactNode;
	router: RegisteredRouter;
}) {
	return (
		<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
			<AuthUIProviderTanstack
				authClient={authClient}
				navigate={(href) => router.navigate({ href })}
				replace={(href) => router.navigate({ href, replace: true })}
				Link={({ href, ...props }) => <Link to={href} {...props} />}
			>
				{children}
			</AuthUIProviderTanstack>
			<Toaster />
		</TRPCProvider>
	);
}

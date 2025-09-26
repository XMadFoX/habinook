import { QueryClientProvider } from "@tanstack/react-query";
import type { RegisteredRouter } from "@tanstack/react-router";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { TrpcProvider } from "./root-provider";
import { routeTree } from "./routeTree.gen";
import { getContext, queryClient } from "./trpc";

export function getRouter() {
	const router = createRouter({
		routeTree,
		scrollRestoration: true,
		context: {
			...getContext(),
			queryClient,
		},
		Wrap: function WrapComponent({ children }) {
			return (
				<QueryClientProvider client={queryClient}>
					<TrpcProvider router={router as RegisteredRouter}>
						{children}
					</TrpcProvider>
				</QueryClientProvider>
			);
		},
	});
	setupRouterSsrQueryIntegration({
		router,
		queryClient,
	});

	return router;
}

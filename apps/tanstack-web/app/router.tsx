import type { TrpcRouter } from "@habinook/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RegisteredRouter } from "@tanstack/react-router";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { createTRPCClient, httpBatchStreamLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";
import { TrpcProvider } from "./root-provider";
import { routeTree } from "./routeTree.gen";
import * as TrpcQuery from "./trpc";

export const queryClient = new QueryClient();

export const trpc = createTRPCOptionsProxy<TrpcRouter>({
	client: createTRPCClient({
		links: [
			httpBatchStreamLink({
				url: "/api/trpc",
				transformer: superjson,
			}),
		],
	}),
	queryClient,
});

export function getRouter() {
	const router = createRouter({
		routeTree,
		scrollRestoration: true,
		context: {
			...TrpcQuery.getContext(),
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

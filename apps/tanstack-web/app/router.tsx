import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import superjson from "superjson";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import * as TanstackQuery from "./root-provider";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createTRPCClient,
	httpBatchLink,
	httpBatchStreamLink,
} from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { TrpcRouter } from "@habinook/trpc";
import { getContext, Provider } from "./root-provider";

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

export const createRouter = () => {
	const router = routerWithQueryClient(
		createTanStackRouter({
			routeTree,
			context: {
				...TanstackQuery.getContext(),
			},
			scrollRestoration: true,
			defaultPreloadStaleTime: 0,
			Wrap: (props: { children: React.ReactNode }) => {
				return (
					<TanstackQuery.Provider>{props.children}</TanstackQuery.Provider>
				);
			},
		}),
		TanstackQuery.getContext().queryClient,
	);

	return router;
};

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof createRouter>;
	}
}

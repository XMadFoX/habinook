import type { TrpcRouter } from "@habinook/trpc";
import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
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

export const createRouter = () => {
	const router = routerWithQueryClient(
		createTanStackRouter({
			routeTree,
			context: {
				...TrpcQuery.getContext(),
			},
			scrollRestoration: true,
			defaultPreloadStaleTime: 0,
			Wrap: (props: { children: React.ReactNode }) => {
				return <TrpcProvider>{props.children}</TrpcProvider>;
			},
		}),
		TrpcQuery.getContext().queryClient,
	);

	return router;
};

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof createRouter>;
	}
}

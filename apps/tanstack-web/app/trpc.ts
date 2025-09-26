import type { TrpcRouter } from "@habinook/trpc";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchStreamLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

export const queryClient = new QueryClient({
	defaultOptions: {
		dehydrate: { serializeData: superjson.serialize },
		hydrate: { deserializeData: superjson.deserialize },
	},
});

function getUrl() {
	const base = (() => {
		if (typeof window !== "undefined") return "";

		return `http://localhost:${process.env.PORT ?? 3000}`;
	})();

	return `${base}/api/trpc`;
}

export const trpcClient = createTRPCClient<TrpcRouter>({
	links: [
		httpBatchStreamLink({
			transformer: superjson,
			url: getUrl(),
		}),
	],
});

const serverHelpers = createTRPCOptionsProxy<TrpcRouter>({
	client: trpcClient,
	queryClient: queryClient,
});

export function getContext() {
	return {
		queryClient,
		trpc: serverHelpers,
	};
}

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

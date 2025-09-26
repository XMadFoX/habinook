import { createContext, trpcRouter } from "@habinook/trpc";
import { createFileRoute } from "@tanstack/react-router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

async function handler({ request }: { request: Request }) {
	return fetchRequestHandler({
		req: request,
		router: trpcRouter,
		endpoint: "/api/trpc",
		createContext,
	});
}

export const Route = createFileRoute("/api/trpc/$")({
	server: {
		handlers: {
			GET: handler,
			POST: handler,
		},
	},
});

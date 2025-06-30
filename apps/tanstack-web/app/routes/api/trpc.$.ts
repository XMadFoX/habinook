import { createContext, trpcRouter } from "@habinook/trpc";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

async function handler({ request }: { request: Request }) {
	return fetchRequestHandler({
		req: request,
		router: trpcRouter,
		endpoint: "/api/trpc",
		createContext,
	});
}

export const APIRoute = createAPIFileRoute("/api/trpc/$")({
	GET: handler,
	POST: handler,
});

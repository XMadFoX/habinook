import { db } from "@habinook/db";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { auth } from "./auth";

export type Context = Awaited<ReturnType<typeof createContext>>;

export const createContext = async (opts: FetchCreateContextFnOptions) => {
	// it seems like getSession needs both req cookies to auth and res to set refresh
	// kinda hacky?
	const reqCookies = opts.req.headers.get("cookie");
	reqCookies && opts.resHeaders.append("cookie", reqCookies);
	const authSession = await auth.api.getSession({
		headers: opts.resHeaders,
	});

	return {
		db,
		user: authSession?.user,
	};
};

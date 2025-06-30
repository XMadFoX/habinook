import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create({ transformer: superjson });

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const createTRPCRouter = t.router;
export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = publicProcedure.use((opts) => {
	if (!opts.ctx.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
		});
	}

	return opts.next({
		ctx: { user: opts.ctx.user },
	});
});

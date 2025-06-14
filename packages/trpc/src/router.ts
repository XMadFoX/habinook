import { createTRPCRouter, publicProcedure } from "./trpc";

export const trpcRouter = createTRPCRouter({
	hello: publicProcedure.query(() => "Hello"),
});

export type TrpcRouter = typeof trpcRouter;

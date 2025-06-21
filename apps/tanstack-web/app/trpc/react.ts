import { TrpcRouter } from "@habinook/trpc";
import { createTRPCContext } from "@trpc/tanstack-react-query";

export const { TRPCProvider, useTRPC } = createTRPCContext<TrpcRouter>();

import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

export { createContext } from "./context";

import type { TrpcRouter } from "./router";
export type { TrpcRouter };
export { trpcRouter } from "./router";

export type RouterInput = inferRouterInputs<TrpcRouter>;
export type RouterOutput = inferRouterOutputs<TrpcRouter>;

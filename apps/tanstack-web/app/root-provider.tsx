import { queryClient, TRPCProvider, trpcClient } from "./trpc";

export function TrpcProvider({ children }: { children: React.ReactNode }) {
	return (
		<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
			{children}
		</TRPCProvider>
	);
}

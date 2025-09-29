import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import vercel from "vite-plugin-vercel";
import tsConfigPaths from "vite-tsconfig-paths";

console.log(
	`Runtime environment: ${process.env?.RUNTIME_ENV}, ${import.meta.env?.RUNTIME_ENV}`,
);

export default defineConfig({
	server: {
		port: 3000,
	},
	build: {
		rollupOptions: {
			external: ["cloudflare:sockets"],
		},
	},
	plugins: [
		...(process.env?.RUNTIME_ENV === "cloudflare"
			? [cloudflare({ viteEnvironment: { name: "ssr" } })]
			: []),
		...(process.env?.RUNTIME_ENV === "vercel" ? [vercel()] : []),
		tsConfigPaths({
			projects: ["./tsconfig.json", "../../packages/ui/tsconfig.json"],
		}),
		tanstackStart({ srcDirectory: "./app" }),
		// react's vite plugin must come after start's vite plugin
		viteReact(),
		tailwindcss(),
	],
});

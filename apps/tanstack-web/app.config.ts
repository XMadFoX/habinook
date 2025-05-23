import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "@tanstack/react-start/config";
import path from "path";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	vite: {
		plugins: [
			tsConfigPaths({
				projects: ["./tsconfig.json", "../../packages/ui/tsconfig.json"],
			}),
			tailwindcss(),
		],
	},
});

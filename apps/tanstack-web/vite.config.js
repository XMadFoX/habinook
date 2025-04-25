import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
// https://vitejs.dev/config/
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "app"),
		},
	},
	plugins: [
		TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
		react(),
		tailwindcss(),
	],
});

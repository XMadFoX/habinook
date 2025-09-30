import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod/v4";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Load environment-specific file, e.g. .env.staging, .env.production
if (process.env.NODE_ENV) {
	dotenv.config({
		path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`),
	});
}

const envSchema = z.discriminatedUnion("ENV_TYPE", [
	z.object({
		ENV_TYPE: z.literal("server").nullish(),
		DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
	}),
	z.object({
		ENV_TYPE: z.literal("serverless"),
		PG_PROXY_URL: z.string().min(1, "PG_PROXY_URL is required"),
		AUTH_TOKEN: z.string().min(1, "AUTH_TOKEN is required"),
	}),
]);

const env = envSchema.parse(process.env);

export { env };

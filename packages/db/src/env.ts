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

const envSchema = z.object({
	DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
});

const env = envSchema.parse(process.env);

export { env };

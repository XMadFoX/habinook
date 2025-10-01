import { inspect } from "node:util";
import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as drizzleHttp } from "drizzle-orm/pg-proxy";
import { env } from "./env";
import * as schema from "./schema";

function customColMapper(value: unknown) {
	if (typeof value === "string") {
		if (value.match(/\d{4}-[01]\d-[0-3]\dT.+Z/)?.input) {
			return new Date(value);
		}
	}
	return value;
}

function createDb() {
	if (env.ENV_TYPE === "serverless") {
		const serverlessEnv = env; // ts hack to get correct types inside of callback

		return drizzleHttp(
			async (sql, params, method) => {
				try {
					const url = serverlessEnv.PG_PROXY_URL;
					console.debug("fetching from pg proxy", {
						url,
						sql,
						params,
						method,
					});
					const res = await fetch(url, {
						body: JSON.stringify({ sql, params, method }),
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${serverlessEnv.AUTH_TOKEN}`,
						},
					});
					const text = await res.text();
					console.debug("fetch response", { text });
					const body = JSON.parse(text);
					console.debug(
						inspect(
							{
								sql,
								params,
								method,
								body,
							},
							{ depth: null, showHidden: false, colors: true },
						),
					);
					const { rows: rowsRaw } = body as { rows: unknown[][] };
					const rows = rowsRaw.map(customColMapper);
					console.dir(rows, { depth: null });

					return { rows: rows };
				} catch (e: unknown) {
					console.error("Error from pg proxy server: ", e);
					return { rows: [] };
				}
			},
			{ schema },
		);
	} else {
		return drizzle({
			connection: {
				connectionString: env.DATABASE_URL,
			},
			schema,
		});
	}
}

const db = createDb();

export { db };
export type DB = typeof db;
export { schema };

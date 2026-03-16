import { Pool, type PoolClient, type PoolConfig, type QueryResultRow } from "pg";

type GlobalWithPgPool = typeof globalThis & {
  __sobreviventesPgPool?: Pool;
};

function parseBoolean(value: string | undefined): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function shouldUseSsl(databaseUrl: string | undefined): boolean {
  const explicitValue = parseBoolean(process.env.DATABASE_SSL);

  if (explicitValue !== null) {
    return explicitValue;
  }

  return databaseUrl?.includes("sslmode=require") ?? false;
}

function getPoolConfig(): PoolConfig {
  const databaseUrl = process.env.DATABASE_URL;
  const ssl = shouldUseSsl(databaseUrl)
    ? { rejectUnauthorized: false }
    : undefined;

  if (databaseUrl) {
    return {
      connectionString: databaseUrl,
      ssl,
    };
  }

  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;

  if (!PGHOST || !PGUSER || !PGDATABASE) {
    throw new Error(
      "Configure DATABASE_URL ou as variaveis PGHOST, PGUSER e PGDATABASE."
    );
  }

  return {
    host: PGHOST,
    port: PGPORT ? Number(PGPORT) : 5432,
    user: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
    ssl,
  };
}

const globalForPg = globalThis as GlobalWithPgPool;

function getPool() {
  if (!globalForPg.__sobreviventesPgPool) {
    globalForPg.__sobreviventesPgPool = new Pool(getPoolConfig());
  }

  return globalForPg.__sobreviventesPgPool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  return getPool().query<T>(text, params);
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
) {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

describe('Database Integration', () => {
  let container: Awaited<ReturnType<PostgreSqlContainer['start']>>;
  let db: ReturnType<typeof drizzle>;
  let client: ReturnType<typeof postgres>;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    const connectionUri = container.getConnectionUri();
    
    client = postgres(connectionUri);
    db = drizzle(client);
  }, 60000);

  afterAll(async () => {
    if (client) await client.end();
    if (container) await container.stop();
  });

  it('should connect to the testcontainer database successfully', async () => {
    const result = await db.execute(sql`SELECT 1 as result`);
    expect(result).toBeDefined();
    expect(result[0].result).toBe(1);
  });
});

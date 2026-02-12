/**
 * Database Client - PostgreSQL connection with Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { appConfig } from '../config.js';
import * as schema from './schema.js';

// Create PostgreSQL connection
const queryClient = postgres(appConfig.database.url);

// Create Drizzle ORM instance
export const db = drizzle(queryClient, { schema });

// Helper to close database connection
export async function closeDatabase() {
  await queryClient.end();
}

export type Database = typeof db;

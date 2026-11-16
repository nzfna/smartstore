import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL ?? "postgresql://missing:missing@localhost/missing");
export type R = Record<string, any>;
export type FormState = { error?: string; ok?: string; values?: Record<string, string> } | null;

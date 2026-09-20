import { neon } from "@neondatabase/serverless";

// One shared database connection, used by every API endpoint.
export const sql = neon(process.env.DATABASE_URL!);
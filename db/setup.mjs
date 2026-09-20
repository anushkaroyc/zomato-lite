// db/setup.mjs
// Applies the schema and seed data to the Neon database, then prints the rows.
// Run with: npm run db:setup

import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "DATABASE_URL is not set. Put DATABASE_URL=<your Neon connection string> in .env.local and try again."
  );
  process.exit(1);
}

// `neon(...)` gives us a function that runs SQL against the database.
const sql = neon(databaseUrl);

// 1. Drop anything from a previous run, so this script is safe to run again.
await sql.query("DROP TABLE IF EXISTS reviews");
await sql.query("DROP TABLE IF EXISTS restaurants");

// 2. Apply the schema, one statement at a time.
const schema = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}

// 3. Seed one restaurant.
await sql.query(
  "INSERT INTO restaurants (name, cuisine, area) VALUES ($1, $2, $3)",
  ["Ludhiana Burrito", "Indian", "Sector 32"]
);

// 4. Seed three reviews, with created_at spread a few days apart.
const daysAgo = (days) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

await sql.query(
  "INSERT INTO reviews (id, restaurant_id, rating, comment, created_at) VALUES ($1, $2, $3, $4, $5)",
  [101, 1, 5, "Paneer burrito is unreal", daysAgo(8)]
);
await sql.query(
  "INSERT INTO reviews (id, restaurant_id, rating, comment, created_at) VALUES ($1, $2, $3, $4, $5)",
  [102, 1, 4, "Good, but slow service", daysAgo(6)]
);
await sql.query(
  "INSERT INTO reviews (id, restaurant_id, rating, comment, created_at) VALUES ($1, $2, $3, $4, $5)",
  [103, 1, 4, "Solid. Would repeat.", daysAgo(2)]
);

// 5. Point Postgres's auto-numbering counter at 103, so the next
//    inserted review gets id 104 (matching the numbers in the spec).
await sql.query("SELECT setval('reviews_id_seq', 103)");

// 6. Show what was created.
const restaurants = await sql.query("SELECT * FROM restaurants ORDER BY id");
const reviews = await sql.query("SELECT * FROM reviews ORDER BY id");

console.log("\nRestaurants table:");
console.table(restaurants);
console.log("\nReviews table:");
console.table(reviews);
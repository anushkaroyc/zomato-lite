import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Always ask the database fresh on every request — a brand new review
// must show up immediately, never from a cached copy of an older answer.
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantId = Number(id);

  // A non-numeric id is the same as a restaurant that doesn't exist.
  if (!Number.isInteger(restaurantId) || restaurantId < 1) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  // Question 1: does the restaurant exist? If not, 404.
  const restaurants = await sql.query(
    "SELECT name, cuisine, area FROM restaurants WHERE id = $1",
    [restaurantId]
  );
  if (restaurants.length === 0) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }
  const restaurant = restaurants[0];

  // Question 2: how many reviews, and what is their average?
  // The average is COMPUTED here, from the review rows. It is not stored.
  // The ::float8 cast turns Postgres's decimal into a real JSON number.
  const totals = await sql.query(
    "SELECT COUNT(*)::int AS total, ROUND(AVG(rating), 1)::float8 AS average FROM reviews WHERE restaurant_id = $1",
    [restaurantId]
  );
  const totalReviews = totals[0].total; // 0 when there are no reviews
  const averageRating = totals[0].average; // null when there are no reviews

  // Question 3: the newest review, ordered by created_at.
  const latestRows = await sql.query(
    "SELECT id, rating, comment, created_at FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1",
    [restaurantId]
  );

  // Question 4: every review except the newest one, newest first.
  const olderRows = await sql.query(
    "SELECT id, rating, comment, created_at FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC, id DESC OFFSET 1",
    [restaurantId]
  );

  const latestReview =
    latestRows.length === 0
      ? null
      : {
          id: latestRows[0].id,
          rating: latestRows[0].rating,
          comment: latestRows[0].comment,
          createdAt: new Date(latestRows[0].created_at).toISOString(),
        };

  const reviews = olderRows.map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: new Date(row.created_at).toISOString(),
  }));

  return NextResponse.json({
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    area: restaurant.area,
    averageRating,
    totalReviews,
    latestReview,
    reviews,
  });
}
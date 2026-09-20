import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  // Read the JSON body. If it isn't valid JSON there is nothing to validate.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      {
        error:
          "Request body must be a JSON object with restaurantId, rating, and comment.",
      },
      { status: 400 }
    );
  }

  const { restaurantId, rating, comment } = body as {
    restaurantId?: unknown;
    rating?: unknown;
    comment?: unknown;
  };

  // Validation 1: rating is an integer from 1 to 5.
  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return NextResponse.json(
      { error: "Rating must be a whole number from 1 to 5." },
      { status: 400 }
    );
  }

  // Validation 2: comment is non-empty after trimming whitespace.
  if (typeof comment !== "string" || comment.trim().length === 0) {
    return NextResponse.json(
      { error: "Please write a comment to go with your rating." },
      { status: 400 }
    );
  }

  // Validation 3: restaurantId refers to a restaurant that actually exists.
  if (
    typeof restaurantId !== "number" ||
    !Number.isInteger(restaurantId) ||
    restaurantId < 1
  ) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 400 });
  }

  const existing = await sql.query(
    "SELECT id FROM restaurants WHERE id = $1",
    [restaurantId]
  );
  if (existing.length === 0) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 400 });
  }

  // Validation passed: insert exactly one row and return its id.
  const inserted = await sql.query(
    "INSERT INTO reviews (restaurant_id, rating, comment) VALUES ($1, $2, $3) RETURNING id",
    [restaurantId, rating, comment.trim()]
  );

  return NextResponse.json(
    { success: true, reviewId: inserted[0].id },
    { status: 201 }
  );
}
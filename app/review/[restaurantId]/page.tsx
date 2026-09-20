"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Stars from "@/components/Stars";

export default function ReviewPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const router = useRouter();

  const [name, setName] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Ask the API for the restaurant's name (and whether it exists at all).
  useEffect(() => {
    fetch(`/api/restaurants/${restaurantId}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        const data = await res.json();
        return data.name;
      })
      .then((fetchedName) => {
        if (fetchedName) setName(fetchedName);
      });
  }, [restaurantId]);

  const canSubmit = rating >= 1 && comment.trim().length > 0 && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: Number(restaurantId),
        rating,
        comment,
      }),
    });

    if (response.status === 201) {
      router.push(`/restaurant/${restaurantId}`);
      return;
    }

    // Rejected: show the backend's own message. We never invent our own.
    const body = await response.json();
    setError(body.error ?? "Something went wrong.");
    setSubmitting(false);
  }

  const wrapper = "mx-auto max-w-[560px] px-6 py-12";

  if (notFound) {
    return (
      <main className={wrapper}>
        <p>We couldn't find that restaurant.</p>
      </main>
    );
  }

  if (name === null) {
    return (
      <main className={wrapper}>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className={wrapper}>
      <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>

      <form onSubmit={handleSubmit} className="mt-10">
        <p className="text-sm font-medium text-stone-700">Your rating</p>
        <div className="mt-3">
          <Stars value={rating} onChange={setRating} />
        </div>
        <p className="mt-2 text-xs text-stone-500" aria-live="polite">
          {rating === 0
            ? "Pick a star to rate this restaurant."
            : `You picked ${rating} out of 5.`}
        </p>

        <label
          htmlFor="comment"
          className="mt-8 block text-sm font-medium text-stone-700"
        >
          Your comment
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="How was it?"
          className="mt-3 w-full resize-none rounded-lg border border-stone-300 bg-white p-3 text-stone-800 focus:border-orange-600 focus:outline-none"
        />

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-8 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
        >
          {submitting ? "Sending…" : "Submit review"}
        </button>
      </form>
    </main>
  );
}
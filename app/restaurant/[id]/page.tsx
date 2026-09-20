"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Stars from "@/components/Stars";

type Review = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
};

type RestaurantData = {
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
  latestReview: Review | null;
  reviews: Review[];
};

// Turns a timestamp into a date a human can read. Presentation only — no maths.
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/restaurants/${id}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (json) setData(json);
        setLoading(false);
      });
  }, [id]);

  const wrapper = "mx-auto max-w-[560px] px-6 py-12";

  if (loading) {
    return (
      <main className={wrapper}>
        <p>Loading…</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className={wrapper}>
        <p>We couldn't find that restaurant.</p>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className={wrapper}>
      <h1 className="text-3xl font-semibold tracking-tight">{data.name}</h1>
      <p className="mt-1 text-sm text-stone-500">
        {data.cuisine} · {data.area}
      </p>

      {data.totalReviews === 0 ? (
        // Empty state: invite the first review.
        <section className="mt-10 rounded-xl border border-stone-200 bg-white p-8 text-center">
          <p className="text-stone-600">No reviews yet.</p>
          <p className="mt-1 text-stone-600">
            Be the first to review {data.name}.
          </p>
          <Link
            href={`/review/${id}`}
            className="mt-6 inline-block rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white"
          >
            Leave a review
          </Link>
        </section>
      ) : (
        <>
          <div className="mt-10 flex items-baseline gap-3">
            {/* The average, printed exactly as the API sent it — 4.5 stays 4.5. */}
            <span className="text-6xl font-semibold tracking-tight">
              {data.averageRating}
            </span>
            <span className="text-sm text-stone-500">
              {data.totalReviews} review{data.totalReviews === 1 ? "" : "s"}
            </span>
          </div>

          {data.latestReview && (
            <section className="mt-8 rounded-xl border border-stone-200 border-l-4 border-l-orange-600 bg-white p-6">
              <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
                Latest review
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Stars value={data.latestReview.rating} />
                <span className="text-xs text-stone-500">
                  {formatDate(data.latestReview.createdAt)}
                </span>
              </div>
              <p className="mt-3 text-stone-800">
                {data.latestReview.comment}
              </p>
            </section>
          )}

          <ul className="mt-8 divide-y divide-stone-200 border-t border-stone-200">
            {data.reviews.map((review) => (
              <li key={review.id} className="py-5">
                <div className="flex items-center gap-3">
                  <Stars value={review.rating} />
                  <span className="text-xs text-stone-500">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-stone-800">{review.comment}</p>
              </li>
            ))}
          </ul>

          <Link
            href={`/review/${id}`}
            className="mt-10 inline-block rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white"
          >
            Leave a review
          </Link>
        </>
      )}
    </main>
  );
}
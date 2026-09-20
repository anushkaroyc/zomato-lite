"use client";

const STAR = "★";

// Displays five stars. When `onChange` is given they become clickable
// (used on the review form); without it they are static (used to show
// ratings). Displays the rating it is given — it never calculates one.
export default function Stars({
  value,
  onChange,
}: {
  value: number;
  onChange?: (rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const starClass = filled ? "text-orange-600" : "text-stone-300";

        if (!onChange) {
          return (
            <span key={n} className={`text-xl ${starClass}`}>
              {STAR}
            </span>
          );
        }

        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`Rate ${n} out of 5`}
            className="text-3xl transition-colors"
          >
            <span className={starClass}>{STAR}</span>
          </button>
        );
      })}
    </div>
  );
}
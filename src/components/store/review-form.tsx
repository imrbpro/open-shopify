"use client";

import { useFormState } from "react-dom";
import { submitReview } from "@/server/actions/storefront";

export function ReviewForm({ slug, productId }: { slug: string; productId: string }) {
  const [state, formAction] = useFormState(submitReview, undefined);
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="shopSlug" value={slug} />
      <input type="hidden" name="productId" value={productId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="store-label" htmlFor="review-author">
            Your name
          </label>
          <input id="review-author" name="author" required className="store-input" />
        </div>
        <div>
          <label className="store-label" htmlFor="review-rating">
            Rating
          </label>
          <select id="review-rating" name="rating" className="store-input" defaultValue="5">
            <option value="5">★★★★★ — Excellent</option>
            <option value="4">★★★★ — Good</option>
            <option value="3">★★★ — Okay</option>
            <option value="2">★★ — Poor</option>
            <option value="1">★ — Bad</option>
          </select>
        </div>
      </div>
      <div>
        <label className="store-label" htmlFor="review-body">
          Review
        </label>
        <textarea id="review-body" name="body" rows={3} required className="store-input" />
      </div>
      <button type="submit" className="store-btn-outline text-xs">
        Publish review
      </button>
      {state?.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-xs font-medium text-emerald-700">{state.success}</p> : null}
    </form>
  );
}

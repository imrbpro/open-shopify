"use client";

import { useFormState } from "react-dom";
import { subscribeNewsletter } from "@/server/actions/storefront";

export function NewsletterForm({ slug }: { slug: string }) {
  const [state, formAction] = useFormState(subscribeNewsletter, undefined);
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="shopSlug" value={slug} />
      <div className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="store-input"
          aria-label="Email address"
        />
        <button type="submit" className="store-btn shrink-0 !px-4 !py-2 text-xs">
          Join
        </button>
      </div>
      {state?.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-xs font-medium text-emerald-700">{state.success}</p> : null}
    </form>
  );
}

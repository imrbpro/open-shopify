"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction, signupAction } from "@/server/actions/auth";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full py-2.5" disabled={pending}>
      {pending ? "Working…" : label}
    </button>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction] = useFormState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      {mode === "signup" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="label">
                Your name
              </label>
              <input id="name" name="name" className="input" placeholder="Alex Morgan" autoComplete="name" required />
            </div>
            <div>
              <label htmlFor="shopName" className="label">
                Store name
              </label>
              <input
                id="shopName"
                name="shopName"
                className="input"
                placeholder="Northwind Supply"
                autoComplete="organization"
                required
              />
            </div>
          </div>
        </>
      ) : null}

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          placeholder="you@company.com"
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={mode === "signup" ? 8 : undefined}
        />
      </div>

      <SubmitButton label={mode === "login" ? "Log in" : "Create your store"} />

      <p className="text-center text-sm text-slate-500">
        {mode === "login" ? (
          <>
            New to OpenStore?{" "}
            <Link href="/signup" className="font-medium text-emerald-700 hover:underline">
              Create a store
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-emerald-700 hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
      {mode === "signup" ? (
        <p className="text-center text-xs text-slate-400">
          Free and open source. No platform fees, no credit card, no paid tiers.
        </p>
      ) : null}
    </form>
  );
}

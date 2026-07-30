"use client";

import { useActionState } from "react";

import {
  bootstrapAction,
  type BootstrapActionState,
} from "@/modules/auth/actions";

const initialState: BootstrapActionState = {};

export function SetupForm() {
  const [state, action, pending] = useActionState(
    bootstrapAction,
    initialState,
  );

  return (
    <form action={action} className="mt-6 space-y-5">
      <label className="block">
        <span className="text-sm font-medium">Username</span>
        <input
          autoComplete="username"
          className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
          disabled={pending}
          maxLength={30}
          minLength={3}
          name="username"
          pattern="[A-Za-z0-9_.]+"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Password</span>
        <input
          autoComplete="new-password"
          className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
          disabled={pending}
          maxLength={128}
          minLength={12}
          name="password"
          required
          type="password"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating administrator…" : "Create administrator"}
      </button>
    </form>
  );
}

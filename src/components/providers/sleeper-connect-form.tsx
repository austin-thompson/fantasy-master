"use client";

import { useActionState } from "react";

import {
  connectSleeperAction,
  type SyncActionState,
} from "@/modules/sync/actions";

const initialState: SyncActionState = { error: null };

export function SleeperConnectForm({
  defaultSeason,
}: {
  readonly defaultSeason: number;
}) {
  const [state, action, pending] = useActionState(
    connectSleeperAction,
    initialState,
  );

  return (
    <form
      action={action}
      className="mt-5 grid gap-4 sm:grid-cols-[1fr_8rem_auto]"
    >
      <label className="grid gap-1.5 text-sm font-medium">
        Sleeper username
        <input
          className="h-11 rounded-lg border bg-background px-3 font-normal"
          name="username"
          autoComplete="off"
          placeholder="your_username"
          required
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Season
        <input
          className="h-11 rounded-lg border bg-background px-3 font-normal"
          name="season"
          type="number"
          min="2017"
          max="2100"
          defaultValue={defaultSeason}
          required
        />
      </label>
      <button
        className="mt-auto h-11 rounded-lg bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Importing…" : "Connect & import"}
      </button>
      {state.error ? (
        <p className="text-sm text-red-700 sm:col-span-3" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/modules/auth/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");
    const result = await authClient.signIn.username({
      username,
      password,
    });

    if (result.error) {
      setError("Invalid username or password.");
      setPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="mt-6 space-y-5" onSubmit={submit}>
      <label className="block">
        <span className="text-sm font-medium">Username</span>
        <input
          autoComplete="username"
          className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
          disabled={pending}
          name="username"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Password</span>
        <input
          autoComplete="current-password"
          className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
          disabled={pending}
          name="password"
          required
          type="password"
        />
      </label>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

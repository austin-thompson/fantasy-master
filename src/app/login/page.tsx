import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-6 py-16">
      <section className="w-full rounded-lg border bg-card p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-4 text-muted-foreground">
          Local account authentication will be implemented in Phase 1.
        </p>
        <Link className="mt-6 inline-block font-medium text-primary" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}

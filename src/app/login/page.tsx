import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { isBootstrapAvailable } from "@/modules/auth/bootstrap";
import { getCurrentSession } from "@/modules/auth/session";
export const metadata: Metadata = {
  title: "Sign in",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isBootstrapAvailable()) {
    redirect("/setup");
  }

  if (await getCurrentSession()) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-6 py-16">
      <section className="w-full rounded-lg border bg-card p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-4 text-muted-foreground">
          Use the local administrator username and password for this
          installation.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}

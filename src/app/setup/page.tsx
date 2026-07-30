import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SetupForm } from "@/components/auth/setup-form";
import { isBootstrapAvailable } from "@/modules/auth/bootstrap";

export const metadata: Metadata = {
  title: "Initial setup",
};

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (!(await isBootstrapAvailable())) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-6 py-16">
      <section className="w-full rounded-lg border bg-card p-8 shadow-sm">
        <p className="mb-3 text-sm font-semibold tracking-wide text-primary uppercase">
          First-run setup
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Create administrator
        </h1>
        <p className="mt-4 text-muted-foreground">
          This is the only account that can be registered through setup. Public
          registration closes after it is created.
        </p>
        <SetupForm />
      </section>
    </main>
  );
}

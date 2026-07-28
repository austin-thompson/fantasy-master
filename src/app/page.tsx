import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section className="w-full rounded-lg border bg-card p-8 shadow-sm">
        <p className="mb-3 text-sm font-semibold tracking-wide text-primary uppercase">
          Foundation ready
        </p>
        <h1 className="text-4xl font-bold tracking-tight">FantasyMaster</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
          A self-hosted command center for coordinating NFL fantasy football
          leagues across providers.
        </p>
        <p className="mt-6 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          Provider integrations remain read-only. Account authentication arrives
          in Phase 1.
        </p>
        <Link
          className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
          href="/login"
        >
          View login placeholder
        </Link>
      </section>
    </main>
  );
}

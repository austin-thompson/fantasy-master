import { synchronizeConnectionAction } from "@/modules/sync/actions";

export function SyncButton({
  connectionId,
}: {
  readonly connectionId: string;
}) {
  return (
    <form action={synchronizeConnectionAction}>
      <input type="hidden" name="connectionId" value={connectionId} />
      <button
        className="rounded-lg border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted"
        type="submit"
      >
        Sync now
      </button>
    </form>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireSession } from "@/modules/auth/session";
import {
  connectSleeperAccount,
  synchronizeConnection,
} from "@/modules/sync/service";

export interface SyncActionState {
  readonly error: string | null;
}

const connectSchema = z.object({
  username: z.string().trim().min(1, "Enter a Sleeper username.").max(50),
  season: z.coerce.number().int().min(2017).max(2100),
});

const synchronizeSchema = z.object({
  connectionId: z.string().uuid(),
});

export async function connectSleeperAction(
  _state: SyncActionState,
  formData: FormData,
): Promise<SyncActionState> {
  const input = connectSchema.safeParse({
    username: formData.get("username"),
    season: formData.get("season"),
  });
  if (!input.success) {
    return { error: input.error.issues[0]?.message ?? "Invalid connection." };
  }

  try {
    const session = await requireSession();
    await connectSleeperAccount(session, input.data);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Sleeper connection failed.",
    };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function synchronizeConnectionAction(formData: FormData) {
  const input = synchronizeSchema.parse({
    connectionId: formData.get("connectionId"),
  });
  const session = await requireSession();
  await synchronizeConnection(session, input.connectionId);
  revalidatePath("/dashboard");
  revalidatePath("/leagues");
}

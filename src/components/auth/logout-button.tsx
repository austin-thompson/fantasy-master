"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/modules/auth/client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      className="rounded-lg border px-4 py-2 font-medium disabled:opacity-60"
      disabled={pending}
      onClick={logout}
      type="button"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

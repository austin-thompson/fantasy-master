import { NextResponse } from "next/server";

import { auth } from "@/modules/auth/auth";
import { listPreferencesForSession } from "@/modules/preferences/queries";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preferences = await listPreferencesForSession(session);
  return NextResponse.json({ preferences });
}

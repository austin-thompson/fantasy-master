import { redirect } from "next/navigation";

import { isBootstrapAvailable } from "@/modules/auth/bootstrap";
import { getCurrentSession } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (await isBootstrapAvailable()) {
    redirect("/setup");
  }

  redirect((await getCurrentSession()) ? "/dashboard" : "/login");
}

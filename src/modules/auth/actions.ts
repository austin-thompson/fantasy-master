"use server";

import { redirect } from "next/navigation";

import { auth } from "@/modules/auth/auth";
import { isBootstrapAvailable } from "@/modules/auth/bootstrap";
import { credentialSchema, localAccountEmail } from "@/modules/auth/validation";

export type BootstrapActionState = {
  error?: string;
};

export async function bootstrapAction(
  _previousState: BootstrapActionState,
  formData: FormData,
): Promise<BootstrapActionState> {
  const credentials = credentialSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!credentials.success) {
    return {
      error: credentials.error.issues[0]?.message ?? "Invalid credentials.",
    };
  }

  if (!(await isBootstrapAvailable())) {
    return {
      error: "Setup is already complete. Sign in instead.",
    };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email: localAccountEmail(credentials.data.username),
        name: credentials.data.username,
        username: credentials.data.username,
        password: credentials.data.password,
      },
    });
  } catch {
    return {
      error:
        "The administrator account could not be created. Check the server logs and try again.",
    };
  }

  redirect("/dashboard");
}

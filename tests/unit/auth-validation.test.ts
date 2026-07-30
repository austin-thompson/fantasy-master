import { describe, expect, it } from "vitest";

import { credentialSchema, localAccountEmail } from "@/modules/auth/validation";

describe("local credential validation", () => {
  it("accepts supported usernames and strong passwords", () => {
    expect(
      credentialSchema.safeParse({
        username: "Fantasy.Manager",
        password: "a-secure-password",
      }).success,
    ).toBe(true);
  });

  it("rejects unsupported usernames and short passwords", () => {
    expect(
      credentialSchema.safeParse({
        username: "not an email@example.com",
        password: "short",
      }).success,
    ).toBe(false);
  });

  it("creates a normalized non-routable internal email", () => {
    expect(localAccountEmail(" Local_Admin ")).toBe(
      "local_admin@local.fantasymaster.invalid",
    );
  });
});

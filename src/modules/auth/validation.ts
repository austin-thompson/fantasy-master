import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(30, "Username must be at most 30 characters.")
  .regex(
    /^[A-Za-z0-9_.]+$/,
    "Username may contain only letters, numbers, underscores, and periods.",
  );

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(128, "Password must be at most 128 characters.");

export const credentialSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export function localAccountEmail(username: string) {
  return `${username.trim().toLowerCase()}@local.fantasymaster.invalid`;
}

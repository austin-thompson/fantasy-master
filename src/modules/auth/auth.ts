import "server-only";

import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { localAccountEmail } from "@/modules/auth/validation";

export const auth = betterAuth({
  appName: "FantasyMaster",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      bootstrapOwner: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
        returned: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/username": {
        window: 60,
        max: 5,
      },
      "/sign-up/email": {
        window: 60,
        max: 3,
      },
    },
  },
  disabledPaths: ["/is-username-available"],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const requestedUsername =
            "username" in user && typeof user.username === "string"
              ? user.username
              : undefined;

          if (
            !requestedUsername ||
            user.email !== localAccountEmail(requestedUsername)
          ) {
            throw new APIError("BAD_REQUEST", {
              message: "A valid local username is required.",
            });
          }

          const existingUser = await prisma.user.findFirst({
            select: { id: true },
          });

          if (existingUser) {
            throw new APIError("FORBIDDEN", {
              message: "Registration is closed for this installation.",
            });
          }

          return { data: user };
        },
      },
    },
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
    }),
    nextCookies(),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;

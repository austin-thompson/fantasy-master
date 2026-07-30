import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const baseUrl = "http://localhost:3000";
const username = "phase_one_admin";
const password = "phase-one-password";

function authRequest(path: string, body: unknown, cookie?: string) {
  return new Request(`${baseUrl}/api/auth${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: baseUrl,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

function sessionCookie(response: Response) {
  const setCookie = response.headers.get("set-cookie");
  expect(setCookie).toBeTruthy();
  return setCookie?.split(";", 1)[0] ?? "";
}

describe.sequential("authentication and ownership", () => {
  let auth: typeof import("@/modules/auth/auth").auth;
  let prisma: typeof import("@/lib/db").prisma;
  let administratorId: string;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL?.includes("_test")) {
      throw new Error(
        "Integration tests require a dedicated database whose name contains '_test'.",
      );
    }

    ({ auth } = await import("@/modules/auth/auth"));
    ({ prisma } = await import("@/lib/db"));

    await prisma.rateLimit.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.userPreference.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it("rejects an email-style public signup while bootstrap is open", async () => {
    const response = await auth.handler(
      authRequest("/sign-up/email", {
        email: "public@example.com",
        name: "public",
        password,
      }),
    );

    expect(response.status).toBe(400);
    expect(await prisma.user.count()).toBe(0);
  });

  it("creates the first administrator and a persistent database session", async () => {
    const response = await auth.handler(
      authRequest("/sign-up/email", {
        email: `${username}@local.fantasymaster.invalid`,
        name: username,
        username,
        password,
      }),
    );

    expect(response.status).toBe(200);
    const cookie = sessionCookie(response);
    const session = await auth.api.getSession({
      headers: new Headers({ Cookie: cookie }),
    });

    expect(session?.user.username).toBe(username);
    administratorId = session?.user.id ?? "";
    expect(
      await prisma.session.count({
        where: { userId: administratorId },
      }),
    ).toBe(1);
  });

  it("keeps registration closed after bootstrap", async () => {
    const response = await auth.handler(
      authRequest("/sign-up/email", {
        email: "second_user@local.fantasymaster.invalid",
        name: "second_user",
        username: "second_user",
        password,
      }),
    );

    expect(response.status).toBe(403);
    expect(await prisma.user.count()).toBe(1);
  });

  it("does not create a session for invalid credentials", async () => {
    const sessionsBefore = await prisma.session.count();
    const response = await auth.handler(
      authRequest("/sign-in/username", {
        username,
        password: "incorrect-password",
      }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await prisma.session.count()).toBe(sessionsBefore);
  });

  it("creates and revokes a session for valid credentials", async () => {
    const signInResponse = await auth.handler(
      authRequest("/sign-in/username", {
        username,
        password,
      }),
    );

    expect(signInResponse.status).toBe(200);
    const cookie = sessionCookie(signInResponse);
    expect(
      await auth.api.getSession({
        headers: new Headers({ Cookie: cookie }),
      }),
    ).not.toBeNull();

    const signOutResponse = await auth.handler(
      authRequest("/sign-out", {}, cookie),
    );
    expect(signOutResponse.status).toBe(200);
    expect(
      await auth.api.getSession({
        headers: new Headers({ Cookie: cookie }),
      }),
    ).toBeNull();
  });

  it("rejects anonymous access to a protected server operation", async () => {
    const { GET } = await import("@/app/api/preferences/route");
    const response = await GET(new Request(`${baseUrl}/api/preferences`));

    expect(response.status).toBe(401);
  });

  it("never returns another user's records", async () => {
    const otherUserId = randomUUID();
    await prisma.user.create({
      data: {
        id: otherUserId,
        name: "other",
        email: "other@local.fantasymaster.invalid",
        emailVerified: false,
      },
    });
    await prisma.userPreference.createMany({
      data: [
        {
          userId: administratorId,
          key: "timezone",
          value: "America/New_York",
        },
        {
          userId: otherUserId,
          key: "timezone",
          value: "America/Chicago",
        },
      ],
    });

    const { listPreferencesForSession } =
      await import("@/modules/preferences/queries");
    const preferences = await listPreferencesForSession({
      session: {
        id: randomUUID(),
        token: "test-token",
        userId: administratorId,
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: null,
        userAgent: null,
      },
      user: {
        id: administratorId,
        name: username,
        email: `${username}@local.fantasymaster.invalid`,
        emailVerified: false,
        image: null,
        username,
        displayUsername: username,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    expect(preferences).toHaveLength(1);
    expect(preferences[0]?.value).toBe("America/New_York");
  });
});

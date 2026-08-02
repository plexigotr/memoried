import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

export type SessionKind = "admin" | "account" | "edit";

type SessionPayload = {
  expiresAt: number;
  kind: SessionKind;
  subject: string;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }

  return secret;
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createSessionToken(
  kind: SessionKind,
  subject: string,
  maxAgeSeconds: number
) {
  const payload: SessionPayload = {
    expiresAt: Math.floor(Date.now() / 1000) + maxAgeSeconds,
    kind,
    subject,
  };
  const encodedPayload = Buffer.from(
    JSON.stringify(payload),
    "utf8"
  ).toString("base64url");

  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function verifySessionToken(
  token: string | undefined,
  expectedKind: SessionKind,
  expectedSubject?: string
) {
  if (!token) return null;

  const [encodedPayload, providedSignature, extra] = token.split(".");
  if (!encodedPayload || !providedSignature || extra) return null;

  const expectedSignature = signPayload(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(providedSignature, "utf8");

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<SessionPayload>;

    if (
      payload.kind !== expectedKind ||
      typeof payload.subject !== "string" ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= Math.floor(Date.now() / 1000) ||
      (expectedSubject !== undefined && payload.subject !== expectedSubject)
    ) {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

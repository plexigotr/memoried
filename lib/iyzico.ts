import crypto from "crypto";

const apiKey = process.env.IYZICO_API_KEY as string;
const secretKey = process.env.IYZICO_SECRET_KEY as string;
const baseUrl = process.env.IYZICO_BASE_URL as string;

function randomString(length = 8) {
  return crypto.randomBytes(length).toString("hex");
}

function buildAuthorization({
  uri,
  body,
  randomKey,
}: {
  uri: string;
  body: string;
  randomKey: string;
}) {
  const payload = body ? `${randomKey}${uri}${body}` : `${randomKey}${uri}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(payload)
    .digest("hex");

  const authString = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`;

  return `IYZWSv2 ${Buffer.from(authString).toString("base64")}`;
}

export async function iyzicoRequest<T>({
  uri,
  payload,
}: {
  uri: string;
  payload: Record<string, unknown>;
}): Promise<T> {
  const body = JSON.stringify(payload);
  const randomKey = randomString(8);

  const authorization = buildAuthorization({
    uri,
    body,
    randomKey,
  });

  const response = await fetch(`${baseUrl}${uri}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
      "x-iyzi-rnd": randomKey,
    },
    body,
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`iyzico request failed: ${response.status} ${text}`);
  }

  return JSON.parse(text) as T;
}
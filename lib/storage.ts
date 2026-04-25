import { Storage } from "@google-cloud/storage";

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY;
const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

if (!projectId || !clientEmail || !privateKey || !bucketName) {
  throw new Error("Google Cloud Storage environment variables are missing.");
}

export const storage = new Storage({
  projectId,
  credentials: {
    client_email: clientEmail,
    private_key: privateKey.replace(/\\n/g, "\n"),
  },
});

export const bucket = storage.bucket(bucketName);

export async function getSignedImageUrl(filePath: string) {
  const [url] = await bucket.file(filePath).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 1000 * 60 * 60,
  });

  return url;
}

export async function getSignedMediaUrl(filePath: string) {
  return getSignedImageUrl(filePath);
}

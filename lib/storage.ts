import { Storage } from "@google-cloud/storage";

export const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export const bucket = storage.bucket(
  process.env.GOOGLE_CLOUD_STORAGE_BUCKET as string
);

export async function getSignedMediaUrl(filePath: string) {
  const [url] = await bucket.file(filePath).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 1000 * 60 * 60,
  });

  return url;
}

export async function getSignedImageUrl(filePath: string) {
  const [url] = await bucket.file(filePath).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 1000 * 60 * 60, // 1 saat
  });

  return url;
}
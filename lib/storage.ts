import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type StorageConfig = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
};

let cachedClient: S3Client | null = null;
let cachedConfig: StorageConfig | null = null;

function getStorageConfig(): StorageConfig {
  if (cachedConfig) return cachedConfig;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "R2 storage environment variables are missing. Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME."
    );
  }

  cachedConfig = { accountId, accessKeyId, secretAccessKey, bucketName };
  return cachedConfig;
}

function getStorageClient() {
  if (cachedClient) return cachedClient;

  const config = getStorageConfig();
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return cachedClient;
}

function objectKey(filePath: string) {
  const key = filePath.trim().replace(/^\/+/, "");

  if (!key || key.includes("..")) {
    throw new Error("Invalid storage object path.");
  }

  return key;
}

export async function getSignedImageUrl(filePath: string) {
  const config = getStorageConfig();

  return getSignedUrl(
    getStorageClient(),
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey(filePath),
    }),
    { expiresIn: 60 * 60 }
  );
}

export async function getSignedMediaUrl(filePath: string) {
  return getSignedImageUrl(filePath);
}

export async function getSignedUploadUrl(
  filePath: string,
  contentType: string,
  expiresInSeconds = 15 * 60
) {
  const config = getStorageConfig();

  return getSignedUrl(
    getStorageClient(),
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey(filePath),
      ContentType: contentType,
    }),
    { expiresIn: expiresInSeconds }
  );
}

export async function uploadMediaObject(
  filePath: string,
  body: Uint8Array,
  contentType: string
) {
  const config = getStorageConfig();

  await getStorageClient().send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey(filePath),
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function mediaObjectExists(filePath: string) {
  const config = getStorageConfig();

  try {
    await getStorageClient().send(
      new HeadObjectCommand({
        Bucket: config.bucketName,
        Key: objectKey(filePath),
      })
    );
    return true;
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;

    if (status === 404) return false;
    throw error;
  }
}

export async function deleteMediaObject(filePath: string) {
  const config = getStorageConfig();

  await getStorageClient().send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey(filePath),
    })
  );
}

export async function deleteMediaPrefix(prefix: string) {
  const config = getStorageConfig();
  const client = getStorageClient();
  const safePrefix = objectKey(prefix);
  let continuationToken: string | undefined;

  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: safePrefix,
        ContinuationToken: continuationToken,
      })
    );

    const objects = (page.Contents || [])
      .map((item) => item.Key)
      .filter((key): key is string => Boolean(key))
      .map((Key) => ({ Key }));

    if (objects.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: config.bucketName,
          Delete: { Objects: objects, Quiet: true },
        })
      );
    }

    continuationToken = page.IsTruncated
      ? page.NextContinuationToken
      : undefined;
  } while (continuationToken);
}

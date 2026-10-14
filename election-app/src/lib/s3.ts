import dotenv from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";

dotenv.config();

export const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || "image";

const accessKeyId = process.env.SUPABASE_ANON_KEY || "";
const secretAccessKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const s3Endpoint =
  process.env.SUPABASE_S3_ENDPOINT || process.env.SUPABASE_URL || "";

const derivePublicBaseUrl = (endpoint: string): string => {
  try {
    const parsed = new URL(endpoint);
    return `${parsed.origin}/storage/v1/object/public`;
  } catch {
    return "";
  }
};

export const SUPABASE_PUBLIC_BASE_URL =
  process.env.SUPABASE_PUBLIC_BASE_URL || derivePublicBaseUrl(s3Endpoint);

if (!s3Endpoint || !accessKeyId || !secretAccessKey) {
  console.warn(
    "Warning: SUPABASE_S3_ENDPOINT/SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY is not set. File uploads may not work.",
  );
}

export const s3Client = new S3Client({
  endpoint: s3Endpoint,
  region: "ap-southeast-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

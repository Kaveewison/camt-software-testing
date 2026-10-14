// src/services/upload.service.ts
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET_NAME, s3Client, SUPABASE_PUBLIC_BASE_URL } from "../lib/s3";

export const generateFileName = (
  folder: string,
  originalName: string,
): string => {
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const uuid = crypto.randomUUID();
  return `${folder}/${uuid}.${ext}`;
};

export const uploadToSupabase = async (
  file: Express.Multer.File,
  folder: string,
): Promise<string> => {
  const fileKey = generateFileName(folder, file.originalname);

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
  } catch (error: any) {
    throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${error?.message || "Unknown error"}`);
  }

  if (!SUPABASE_PUBLIC_BASE_URL) {
    throw new Error("ไม่พบ SUPABASE_PUBLIC_BASE_URL สำหรับสร้าง public URL");
  }

  return `${SUPABASE_PUBLIC_BASE_URL}/${BUCKET_NAME}/${fileKey}`;
};

export const deleteFromSupabase = async (imageUrl: string): Promise<void> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split(`/${BUCKET_NAME}/`);
    if (urlParts.length < 2) return;

    const filePath = urlParts[1].split("?")[0];

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filePath,
      }),
    );
  } catch (error) {
    // Log but don't throw - deletion failure shouldn't break the flow
    console.error("Failed to delete old image:", error);
  }
};

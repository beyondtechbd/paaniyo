// lib/storage.ts
// Cloudflare R2 Storage utility for image uploads

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3-compatible client for Cloudflare R2
const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'paaniyo';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Generate a unique filename for upload
 */
function generateKey(folder: string, originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${folder}/${timestamp}-${random}.${extension}`;
}

/**
 * Upload a file to R2
 */
export async function uploadFile(
  file: Buffer,
  originalName: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<UploadResult> {
  try {
    // Validate file type
    if (!ALLOWED_TYPES.includes(contentType)) {
      return {
        success: false,
        error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
      };
    }

    // Validate file size
    if (file.length > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    const key = generateKey(folder, originalName);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1 year cache
    });

    await R2.send(command);

    const url = `${PUBLIC_URL}/${key}`;

    return {
      success: true,
      url,
      key,
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload multiple files to R2
 */
export async function uploadMultipleFiles(
  files: Array<{ buffer: Buffer; name: string; type: string }>,
  folder: string = 'uploads'
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map((file) => uploadFile(file.buffer, file.name, file.type, folder))
  );
  return results;
}

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await R2.send(command);

    return { success: true };
  } catch (error) {
    console.error('R2 delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Delete multiple files from R2
 */
export async function deleteMultipleFiles(keys: string[]): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  await Promise.all(
    keys.map(async (key) => {
      const result = await deleteFile(key);
      if (!result.success && result.error) {
        errors.push(`${key}: ${result.error}`);
      }
    })
  );

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Generate a presigned URL for direct upload (client-side upload)
 */
export async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<{ success: boolean; uploadUrl?: string; key?: string; publicUrl?: string; error?: string }> {
  try {
    // Validate content type
    if (!ALLOWED_TYPES.includes(contentType)) {
      return {
        success: false,
        error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
      };
    }

    const key = generateKey(folder, filename);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(R2, command, { expiresIn: 3600 }); // 1 hour

    return {
      success: true,
      uploadUrl,
      key,
      publicUrl: `${PUBLIC_URL}/${key}`,
    };
  } catch (error) {
    console.error('Presigned URL error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate upload URL',
    };
  }
}

/**
 * Get a presigned URL for reading a private file
 */
export async function getPresignedReadUrl(key: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(R2, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Presigned read URL error:', error);
    return null;
  }
}

/**
 * Extract the key from a full URL
 */
export function extractKeyFromUrl(url: string): string | null {
  if (!url || !PUBLIC_URL) return null;
  
  if (url.startsWith(PUBLIC_URL)) {
    return url.replace(`${PUBLIC_URL}/`, '');
  }
  
  // Try to extract from path if it's a relative URL
  const match = url.match(/(?:products|brands|users|uploads)\/[\w-]+\.\w+$/);
  return match ? match[0] : null;
}

/**
 * Get folder-specific upload functions
 */
export const productImages = {
  upload: (file: Buffer, name: string, type: string) => uploadFile(file, name, type, 'products'),
  uploadMultiple: (files: Array<{ buffer: Buffer; name: string; type: string }>) =>
    uploadMultipleFiles(files, 'products'),
  getPresignedUrl: (filename: string, contentType: string) =>
    getPresignedUploadUrl(filename, contentType, 'products'),
};

export const brandImages = {
  upload: (file: Buffer, name: string, type: string) => uploadFile(file, name, type, 'brands'),
  uploadMultiple: (files: Array<{ buffer: Buffer; name: string; type: string }>) =>
    uploadMultipleFiles(files, 'brands'),
  getPresignedUrl: (filename: string, contentType: string) =>
    getPresignedUploadUrl(filename, contentType, 'brands'),
};

export const userAvatars = {
  upload: (file: Buffer, name: string, type: string) => uploadFile(file, name, type, 'users'),
  getPresignedUrl: (filename: string, contentType: string) =>
    getPresignedUploadUrl(filename, contentType, 'users'),
};

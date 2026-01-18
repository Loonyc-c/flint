// =============================================================================
// Cloudinary Upload Utility
// =============================================================================

/**
 * Environment variables required:
 * - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: Your Cloudinary cloud name
 * - NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: Unsigned upload preset name
 */

// =============================================================================
// Types
// =============================================================================

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  resource_type: string;
  created_at: string;
}

interface CloudinaryUploadOptions {
  folder?: string;
  maxFileSize?: number; // in bytes
  allowedFormats?: string[];
}

interface UploadResult {
  url: string;
  publicId: string;
}

// =============================================================================
// Constants
// =============================================================================

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ALLOWED_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const DEFAULT_AUDIO_FORMATS = [
  "audio/webm",
  "audio/mp3",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/m4a",
  "audio/x-m4a",
  "audio/mp4",
  "audio/aac",
];

// =============================================================================
// Validation
// =============================================================================

const validateFile = (
  file: File | Blob,
  maxFileSize: number,
  allowedFormats: string[],
): void => {
  const rawType = file.type;
  const parts = rawType ? String(rawType).split(";") : [];
  const mimeType = parts[0] ? parts[0].toLowerCase() : "";

  if (mimeType && !allowedFormats.includes(mimeType)) {
    throw new Error(
      `Invalid file format: ${file.type}. Allowed formats: ${allowedFormats.map((f) => f.split("/")[1]).join(", ")}`,
    );
  }

  if (file.size > maxFileSize) {
    const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(1);
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
  }
};

// =============================================================================
// Upload Functions
// =============================================================================

/**
 * Uploads an image file to Cloudinary.
 *
 * @param file - The image file to upload
 * @param options - Upload options (folder, maxFileSize, allowedFormats)
 * @returns Promise containing the uploaded image URL and public ID
 * @throws Error if upload fails or validation fails
 */
export const uploadImageToCloudinary = async (
  file: File,
  options: CloudinaryUploadOptions = {},
): Promise<UploadResult> => {
  // Validate environment variables
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary cloud name is not configured");
  }

  if (!CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary upload preset is not configured");
  }

  const {
    folder = "flint/profile-photos",
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    allowedFormats = DEFAULT_ALLOWED_FORMATS,
  } = options;

  // Validate file
  validateFile(file, maxFileSize, allowedFormats);

  // Prepare form data
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", folder);

  // Upload to Cloudinary
  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || "Failed to upload image to Cloudinary",
    );
  }

  const data: CloudinaryUploadResponse = await response.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
};

/**
 * Uploads an audio file to Cloudinary.
 *
 * @param blob - The audio blob to upload
 * @param options - Upload options (folder, maxFileSize, allowedFormats)
 * @returns Promise containing the uploaded audio URL and public ID
 */
export const uploadAudioToCloudinary = async (
  blob: Blob,
  options: CloudinaryUploadOptions = {},
): Promise<UploadResult> => {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary cloud name is not configured");
  }

  if (!CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary upload preset is not configured");
  }

  const {
    folder = "flint/profile-questions",
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    allowedFormats = DEFAULT_AUDIO_FORMATS,
  } = options;

  // Validate file
  validateFile(blob, maxFileSize, allowedFormats);

  // Prepare form data
  const formData = new FormData();
  formData.append("file", blob);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", folder);

  // Upload to Cloudinary - use 'video' for audio files
  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || "Failed to upload audio to Cloudinary",
    );
  }

  const data: CloudinaryUploadResponse = await response.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
};

"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
} from "react";
import { toast } from "react-toastify";

export const useProfilePhoto = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // Cleanup preview URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const handlePhotoSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const allowedFormats = ["image/jpeg", "image/png", "image/webp"];
      const maxFileSize = 5 * 1024 * 1024; // 5MB

      if (!allowedFormats.includes(file.type)) {
        toast.error("Invalid file format. Allowed: JPG, PNG, WebP");
        return;
      }

      if (file.size > maxFileSize) {
        toast.error("File size exceeds 5MB limit");
        return;
      }

      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }

      setPendingPhotoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreviewUrl(previewUrl);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [photoPreviewUrl],
  );

  const clearPendingPhoto = useCallback(() => {
    setPendingPhotoFile(null);
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
      setPhotoPreviewUrl(null);
    }
  }, [photoPreviewUrl]);

  return {
    fileInputRef,
    pendingPhotoFile,
    photoPreviewUrl,
    handlePhotoSelect,
    clearPendingPhoto,
    triggerFileInput: () => fileInputRef.current?.click(),
  };
};

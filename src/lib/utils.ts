import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeMediaUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith("/files/")) {
    return `/api${url}`;
  }
  return url;
}

export function extractFileIdFromMediaUrl(url?: string | null) {
  const normalized = normalizeMediaUrl(url);
  if (!normalized) return null;
  const match = normalized.match(/\/files\/([^/]+)\/(download|base64)$/i);
  return match?.[1] || null;
}

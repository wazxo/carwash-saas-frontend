"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

type AuthenticatedImageProps = {
  fileId: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

type Base64Response = {
  data: {
    base64: string;
  };
};

export function AuthenticatedImage({ fileId, alt, width, height, className }: AuthenticatedImageProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadImage() {
      try {
        const res = await apiFetch<Base64Response>(`/files/${fileId}/base64`);
        if (!cancelled) {
          setSrc(res.data.base64);
        }
      } catch {
        if (!cancelled) {
          setSrc(null);
        }
      }
    }

    void loadImage();

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  if (!src) return null;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      className={className}
    />
  );
}

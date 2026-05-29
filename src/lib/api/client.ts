import { useAuthStore } from "@/lib/auth/store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
  suppressAuthRedirect?: boolean;
  suppressTokenRefresh?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { auth = true, suppressAuthRedirect = false, suppressTokenRefresh = false, ...requestInit } = options;
  const accessToken = useAuthStore.getState().accessToken;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(requestInit.headers as Record<string, string>),
  };

  if (auth && accessToken && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  if (requestInit.body && typeof requestInit.body === "string") {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...requestInit,
    headers,
  });

  if (res.status === 401) {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!suppressTokenRefresh && refreshToken) {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const newToken = data.data?.accessToken ?? data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        // Retry original request
        return apiFetch(path, options);
      }
    }
    const error = await res.json().catch(() => ({ message: "Unauthorized" }));
    if (suppressAuthRedirect) {
      throw new Error(error.message || "Unauthorized");
    }
    useAuthStore.getState().clearAuth();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error(error.message || "Session expired");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function apiDownload(
  path: string,
  filename: string,
  options: ApiFetchOptions = {}
) {
  const { auth = true, suppressAuthRedirect = false, suppressTokenRefresh = false, ...requestInit } = options;
  const accessToken = useAuthStore.getState().accessToken;

  const headers: Record<string, string> = {
    Accept: "*/*",
    ...(requestInit.headers as Record<string, string>),
  };

  if (auth && accessToken && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...requestInit,
    headers,
  });

  if (res.status === 401) {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!suppressTokenRefresh && refreshToken) {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const newToken = data.data?.accessToken ?? data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        return apiDownload(path, filename, options);
      }
    }
    const error = await res.json().catch(() => ({ message: "Unauthorized" }));
    if (suppressAuthRedirect) {
      throw new Error(error.message || "Unauthorized");
    }
    useAuthStore.getState().clearAuth();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error(error.message || "Session expired");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

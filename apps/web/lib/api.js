"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";
const TOKEN_KEY = "issue-tracker-token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(TOKEN_KEY);
}

export async function api(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  if (response.status === 401 && path !== "/auth/login") {
    clearToken();
    if (typeof window !== "undefined") window.location.assign("/login");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || "The request could not be completed.");
    error.status = response.status;
    error.code = payload?.error?.code;
    error.details = payload?.error?.details || [];
    throw error;
  }
  return payload;
}

export function explainError(error) {
  const details = error?.details?.map((item) => item.message).filter(Boolean);
  return details?.length ? details.join(" ") : error?.message || "Something went wrong. Please try again.";
}

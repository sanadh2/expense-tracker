import { env } from "@/lib/env";

const BASE_URL = env.NEXT_PUBLIC_APP_URL;

type RequestConfig = RequestInit & {
  params?: Record<string, string>;
};

async function request<T>(
  endpoint: string,
  config: RequestConfig = {},
): Promise<T> {
  const { params, ...init } = config;

  const url = new URL(endpoint, BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    const err = new Error(
      (error as { message?: string }).message ?? "Request failed",
    ) as Error & { fieldErrors?: Record<string, string[]> };
    err.fieldErrors = (error as { error?: Record<string, string[]> }).error;
    throw err;
  }

  return response.json().catch(() => ({}) as T);
}

export const api = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: "GET" }),

  post: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: "DELETE" }),
};

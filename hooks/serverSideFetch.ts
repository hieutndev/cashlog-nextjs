import { IAPIResponse } from "@/types/global";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_API_URL;

interface nonAuthFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: HeadersInit;
  body?: any;
  cache?: RequestCache;
  revalidate?: number | false;
}

export async function serverSideFetch<T>(
  endpoint: string,
  options: nonAuthFetchOptions = {}
): Promise<IAPIResponse<T>> {
  const {
    method = "GET",
    headers = {},
    body,
    cache = "force-cache",
    revalidate
  } = options;

  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_BASE_API_URL environment variable is not set");
  }

  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    cache,
    ...(revalidate !== undefined && { next: { revalidate } }),
  };

  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      // For server-side rendering, we'll return an error response instead of throwing
      return {
        status: "error",
        message: "FETCH_ERROR" as any,
        errors: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    return data;
  } catch (error) {
    // Return error response for SSR compatibility
    return {
      status: "error",
      message: "NETWORK_ERROR" as any,
      errors: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

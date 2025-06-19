const BASE_URL = process.env.NEXT_PUBLIC_BASE_API_URL;

import { useEffect, useState } from "react";
import { setCookie, getCookie, hasCookie } from "cookies-next";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface FetchOptions<TBody> {
  method?: HttpMethod;
  body?: TBody;
  headers?: HeadersInit;
  skip?: boolean; // skip fetch on mount
}

type SearchParams = Record<string, string | number | boolean | null | undefined>;

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  statusCode: number | null;
}

const buildQueryString = (params: SearchParams): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : '';
};

const parseURL = (url: string, searchParams?: SearchParams) => {
  if (!url) {
    throw new Error("URL is required");
  }

  let baseUrl: string;

  if (!url.includes("http") && url.startsWith("/")) {
    baseUrl = `${BASE_URL}${url}`;
  } else if (!url.includes("http")) {
    baseUrl = `${BASE_URL}/${url}`;
  } else {
    baseUrl = url;
  }

  // Add query parameters if provided
  if (searchParams && Object.keys(searchParams).length > 0) {
    const queryString = buildQueryString(searchParams);

    if (queryString) {
      // Check if URL already has query parameters
      if (baseUrl.includes('?')) {
        // URL already has query params, append with &
        return `${baseUrl}&${queryString.substring(1)}`; // Remove the leading '?'
      } else {
        // URL doesn't have query params, append with ?
        return `${baseUrl}${queryString}`; // Keep the leading '?'
      }
    }
  }

  return baseUrl;
};

async function refreshToken() {

  const headers = new Headers();

  headers.append("Content-Type", "application/json");
  headers.append("x-rftk", getCookie("refresh_token") as string || "");

  const response = await fetch(`${BASE_URL}/users/x-rftk`, {
    method: "GET",
    headers
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await response.json();

  setCookie("access_token", data.results.access_token, { path: "/" });
}

// Function overloads for backward compatibility
export function useFetch<TResponse = any, TBody = any>(
  url: string,
  options?: FetchOptions<TBody>
): FetchState<TResponse> & { fetch: () => Promise<void> };

export function useFetch<TResponse = any, TBody = any>(
  url: string,
  searchParams?: SearchParams,
  options?: FetchOptions<TBody>
): FetchState<TResponse> & { fetch: () => Promise<void> };

export function useFetch<TResponse = any, TBody = any>(
  url: string,
  searchParamsOrOptions?: SearchParams | FetchOptions<TBody>,
  options?: FetchOptions<TBody>
) {
  // Determine if the second parameter is searchParams or options
  const isSearchParams = searchParamsOrOptions &&
    typeof searchParamsOrOptions === 'object' &&
    !('method' in searchParamsOrOptions) &&
    !('body' in searchParamsOrOptions) &&
    !('headers' in searchParamsOrOptions) &&
    !('skip' in searchParamsOrOptions);

  const searchParams = isSearchParams ? searchParamsOrOptions as SearchParams : undefined;
  const finalOptions = isSearchParams ? options : searchParamsOrOptions as FetchOptions<TBody>;
  const [state, setState] = useState<FetchState<TResponse>>({
    data: null,
    loading: !finalOptions?.skip,
    error: null,
    statusCode: null,
  });

  const fetchData = async () => {
    setState((prevState) => ({ ...prevState, loading: true, error: null, statusCode: null }));

    try {
      const response = await fetch(parseURL(url, searchParams), {
        method: finalOptions?.method ?? "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getCookie("access_token") || ""}`,
          ...(finalOptions?.headers || {}),
        },
        body: finalOptions?.body ? JSON.stringify(finalOptions.body) : undefined,
      });

      if (response.status === 401 && hasCookie("refresh_token")) {
        await refreshToken();

        const retryResponse = await fetch(parseURL(url, searchParams), {
          method: finalOptions?.method ?? "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getCookie("access_token") || ""}`,
            ...(finalOptions?.headers || {}),
          },
          body: finalOptions?.body ? JSON.stringify(finalOptions.body) : undefined,
        });

        if (!retryResponse.ok) {
          const errorText = await retryResponse.text();

          setState({ data: null, loading: false, error: errorText || retryResponse.statusText, statusCode: retryResponse.status });

          return;
        }

        const retryData = await retryResponse.json();

        setState({ data: retryData, loading: false, error: null, statusCode: retryResponse.status });

        return;
      }

      if (!response.ok) {
        const errorText = await response.text();

        setState({ data: null, loading: false, error: errorText || response.statusText, statusCode: response.status });

        return;
      }

      const data = await response.json();

      setState({ data, loading: false, error: null, statusCode: response.status });
    } catch (error: any) {
      setState({ data: null, loading: false, error: error.message, statusCode: null });
    }
  };

  useEffect(() => {
    if (!finalOptions?.skip) {
      fetchData();
    }
  }, [url, searchParams, finalOptions]);

  return { ...state, fetch: fetchData };
}

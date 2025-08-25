import { useEffect, useState, useMemo } from "react";
import { getCookie, hasCookie, setCookie } from "cookies-next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_API_URL;

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface FetchOptions<TBody> {
  method?: HttpMethod;
  body?: TBody;
  headers?: HeadersInit;
  skip?: boolean; // skip fetch on mount,
  options?: {
    removeContentType?: boolean;
  };
}

type SearchParams = Record<
  string,
  string | number | boolean | null | undefined
>;

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

  return queryString ? `?${queryString}` : "";
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
      if (baseUrl.includes("?")) {
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
  headers.append("x-rftk", (getCookie("refresh_token") as string) || "");

  const response = await fetch(`${BASE_URL}/users/x-rftk`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("RefreshTokenExpiredError");
  }

  const data = await response.json();

  setCookie("access_token", data.results.access_token, { path: "/" });
}

// Function overloads for backward compatibility
export function useFetch<TResponse = any, TBody = any>(
  url: string,
  options?: FetchOptions<TBody>
): FetchState<TResponse> & {
  fetch: (overrideOptions?: FetchOptions<TBody>) => Promise<void>;
};

export function useFetch<TResponse = any, TBody = any>(
  url: string,
  searchParams?: SearchParams,
  options?: FetchOptions<TBody>
): FetchState<TResponse> & {
  fetch: (overrideOptions?: FetchOptions<TBody>) => Promise<void>;
};

export function useFetch<TResponse = any, TBody = any>(
  url: string,
  searchParamsOrOptions?: SearchParams | FetchOptions<TBody>,
  options?: FetchOptions<TBody>
) {
  // Determine if the second parameter is searchParams or options
  const isSearchParams =
    searchParamsOrOptions &&
    typeof searchParamsOrOptions === "object" &&
    !("method" in searchParamsOrOptions) &&
    !("body" in searchParamsOrOptions) &&
    !("headers" in searchParamsOrOptions) &&
    !("skip" in searchParamsOrOptions) &&
    !("options" in searchParamsOrOptions);

  const searchParams = isSearchParams
    ? (searchParamsOrOptions as SearchParams)
    : undefined;
  const rawOptions = isSearchParams
    ? options
    : (searchParamsOrOptions as FetchOptions<TBody>);

  // Memoize the final options to prevent unnecessary re-renders
  const finalOptions = useMemo(
    () => rawOptions || {},
    [
      rawOptions?.method,
      rawOptions?.skip,
      rawOptions?.options?.removeContentType,
      JSON.stringify(rawOptions?.headers || {}),
      // Note: body is handled separately in fetchData to avoid serialization issues
    ]
  );

  // Memoize searchParams to prevent unnecessary re-renders
  const memoizedSearchParams = useMemo(
    () => searchParams,
    [JSON.stringify(searchParams || {})]
  );

  const [state, setState] = useState<FetchState<TResponse>>({
    data: null,
    loading: !finalOptions?.skip,
    error: null,
    statusCode: null,
  });

  const parseFetchBody = (fetchBody: any) => {
    if (fetchBody instanceof FormData) {
      return fetchBody;
    }

    return JSON.stringify(fetchBody);
  };

  const fetchData = async (overrideOptions?: FetchOptions<TBody>) => {
    setState((prevState) => ({
      ...prevState,
      loading: true,
      error: null,
      statusCode: null,
    }));

    const mergedOptions = {
      ...finalOptions,
      ...overrideOptions,
      headers: {
        ...finalOptions?.headers,
        ...overrideOptions?.headers,
      },
      body: overrideOptions?.body ?? rawOptions?.body,
    };

    try {
      const response = await fetch(parseURL(url, memoizedSearchParams), {
        method: mergedOptions.method ?? "GET",
        headers: {
          ...(mergedOptions.options?.removeContentType
            ? {}
            : { "Content-Type": "application/json" }),
          Authorization: `Bearer ${getCookie("access_token") || ""}`,
          ...(mergedOptions.headers || {}),
        },
        body: mergedOptions.body
          ? parseFetchBody(mergedOptions.body)
          : undefined,
      });

      if (response.status === 401 && hasCookie("refresh_token")) {
        await refreshToken();

        const retryResponse = await fetch(parseURL(url, memoizedSearchParams), {
          method: mergedOptions.method ?? "GET",
          headers: {
            ...(mergedOptions.options?.removeContentType
              ? {}
              : { "Content-Type": "application/json" }),
            Authorization: `Bearer ${getCookie("access_token") || ""}`,
            ...(mergedOptions.headers || {}),
          },
          body: mergedOptions.body
            ? parseFetchBody(mergedOptions.body)
            : undefined,
        });

        if (!retryResponse.ok) {
          const errorText = await retryResponse.text();

          setState({
            data: null,
            loading: false,
            error: errorText || retryResponse.statusText,
            statusCode: retryResponse.status,
          });

          return;
        }

        const retryData = await retryResponse.json();

        setState({
          data: retryData,
          loading: false,
          error: null,
          statusCode: retryResponse.status,
        });

        return;
      }

      if (!response.ok) {


        const responseText = await response.text();

        const errorJson = JSON.parse(responseText || '{}');

        setState({
          data: null,
          loading: false,
          error: responseText || response.statusText,
          statusCode: response.status,
        });

        if (errorJson.message === "NO_PERMISSION") {
          window.location.href = "/sign-in?message=NO_PERMISSION";
        }

        return;
      }

      const data = await response.json();

      setState({
        data,
        loading: false,
        error: null,
        statusCode: response.status,
      });
    } catch (error: any) {
      if (error.message === "RefreshTokenExpiredError") {
        setState({ data: null, loading: false, error: null, statusCode: null });
        window.location.href = "/sign-in?message=EXPIRED_REFRESH_TOKEN";
      } else {
        setState({ data: null, loading: false, error: error.message, statusCode: null });
      }
    }
  };

  useEffect(() => {
    if (!finalOptions?.skip) {
      fetchData();
    }
  }, [
    url,
    memoizedSearchParams,
    finalOptions.method,
    finalOptions.skip,
    finalOptions.options?.removeContentType,
    JSON.stringify(finalOptions.headers || {}),
  ]);

  return { ...state, fetch: fetchData };
}

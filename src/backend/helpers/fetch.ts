import { ofetch } from "ofetch";

import { proxyUrlRequest } from "@frontend/api/proxy";

type P<T> = Parameters<typeof ofetch<T, any>>;
type R<T> = ReturnType<typeof ofetch<T, any>>;

const baseFetch = ofetch.create({
  retry: 0,
});

export function makeUrl(url: string, data: Record<string, string>) {
  let parsedUrl: string = url;
  Object.entries(data).forEach(([k, v]) => {
    parsedUrl = parsedUrl.replace(`{${k}}`, encodeURIComponent(v));
  });
  return parsedUrl;
}

async function proxyCompatibleFetch<T>(
  url: string,
  ops: P<T>[1] = {},
): Promise<T> {
  const combined = new URL(url, ops.baseURL);
  Object.entries((ops.params ?? {}) as Record<string, string>).forEach(
    ([k, v]) => {
      combined.searchParams.set(k, v);
    },
  );
  Object.entries((ops.query ?? {}) as Record<string, string>).forEach(
    ([k, v]) => {
      combined.searchParams.set(k, v);
    },
  );

  return proxyUrlRequest<T>({
    url: combined.toString(),
    method:
      (ops.method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined) ??
      "GET",
    body: ops.body,
    headers: (ops.headers as Record<string, string> | undefined) ?? undefined,
    timeoutMs: 10000,
    retries: 1,
    cacheTtlMs: ops.method && ops.method !== "GET" ? undefined : 30_000,
  });
}

export function mwFetch<T>(url: string, ops: P<T>[1] = {}): R<T> {
  if (url.startsWith("/")) {
    return baseFetch<T>(url, ops);
  }
  return proxyCompatibleFetch<T>(url, ops) as R<T>;
}

export async function singularProxiedFetch<T>(
  _proxyUrl: string,
  url: string,
  ops: P<T>[1] = {},
): R<T> {
  return proxyCompatibleFetch<T>(url, ops) as R<T>;
}

export function proxiedFetch<T>(url: string, ops: P<T>[1] = {}): R<T> {
  return proxyCompatibleFetch<T>(url, ops) as R<T>;
}

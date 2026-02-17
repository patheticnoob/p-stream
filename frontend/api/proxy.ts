import { requireConvexClient } from "./convexClient";

type ProxyMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type TargetMatch = {
  target: string;
  path: string;
};

const HOST_TARGET_MAP: Record<string, string> = {
  "api.themoviedb.org": "tmdb",
  "api.tmdb.org": "tmdbAlt",
  "fed-airdate.pstream.mov": "trakt",
  "apis.justwatch.com": "justwatch",
  "www.imdb.com": "imdb",
  "www.rottentomatoes.com": "rottenTomatoes",
  "fed-trailers.pstream.mov": "fedTrailers",
  "rest.opensubtitles.org": "opensubtitles",
  "fed-subs.pstream.mov": "febboxSubtitles",
  "sub.vdrk.site": "vdrkSubtitles",
  "api.introdb.app": "introDb",
  "api.theintrodb.org": "theIntroDb",
  "fed-skips.pstream.mov": "fedSkips",
  "skips.pstream.mov": "skipAnalytics",
  "ipapi.co": "ipapi",
  "ipinfo.io": "ipinfo",
};

function getCorrelationId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `cid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getAuthContext() {
  return {
    origin: typeof window !== "undefined" ? window.location.origin : undefined,
    referer: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    correlationId: getCorrelationId(),
  };
}

function resolveTargetFromUrl(rawUrl: string): TargetMatch {
  const parsed = new URL(rawUrl);
  const target = HOST_TARGET_MAP[parsed.hostname];
  if (!target) {
    throw new Error(
      `URL hostname '${parsed.hostname}' is not proxy allowlisted.`,
    );
  }

  return {
    target,
    path: parsed.pathname,
  };
}

function paramsFromUrl(rawUrl: string): Record<string, string> {
  const parsed = new URL(rawUrl);
  return Object.fromEntries(parsed.searchParams.entries());
}

export async function proxyRequest(input: {
  target: string;
  method?: ProxyMethod;
  path?: string;
  params?: Record<string, string>;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  cacheTtlMs?: number;
}) {
  const auth = getAuthContext();

  return requireConvexClient().action(
    "proxy:request" as never,
    {
      method: input.method ?? "GET",
      auth,
      headers: {
        ...(input.headers ?? {}),
        "x-correlation-id": auth.correlationId,
      },
      ...input,
    } as never,
  );
}

export async function proxyUrlRequest<T = unknown>(input: {
  url: string;
  method?: ProxyMethod;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  cacheTtlMs?: number;
}): Promise<T> {
  const { target, path } = resolveTargetFromUrl(input.url);
  const response: any = await proxyRequest({
    target,
    path,
    params: paramsFromUrl(input.url),
    method: input.method,
    body: input.body,
    headers: input.headers,
    timeoutMs: input.timeoutMs,
    retries: input.retries,
    cacheTtlMs: input.cacheTtlMs,
  });

  if (!response.ok) {
    throw new Error(`Proxy request failed with status ${response.status}`);
  }

  return response.data as T;
}

export async function setProxyValue(input: { key: string; value: string }) {
  return requireConvexClient().mutation("proxy:set" as never, input as never);
}

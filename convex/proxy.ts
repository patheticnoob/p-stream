import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type AllowedMethod = (typeof ALLOWED_METHODS)[number];

type ProxyTargetConfig = {
  baseUrl: string;
  methods: readonly AllowedMethod[];
  includeAuthToken?: boolean;
  includeCookies?: boolean;
  includeReferer?: boolean;
  includeUserAgent?: boolean;
  defaultHeaders?: Record<string, string>;
};

const TARGETS: Record<string, ProxyTargetConfig> = {
  tmdb: {
    baseUrl: "https://api.themoviedb.org/3",
    methods: ["GET"],
  },
  tmdbAlt: {
    baseUrl: "https://api.tmdb.org/3",
    methods: ["GET"],
  },
  trakt: {
    baseUrl: "https://fed-airdate.pstream.mov",
    methods: ["GET", "POST"],
  },
  justwatch: {
    baseUrl: "https://apis.justwatch.com",
    methods: ["GET", "POST"],
  },
  imdb: {
    baseUrl: "https://www.imdb.com",
    methods: ["GET"],
  },
  rottenTomatoes: {
    baseUrl: "https://www.rottentomatoes.com",
    methods: ["GET"],
  },
  fedTrailers: {
    baseUrl: "https://fed-trailers.pstream.mov",
    methods: ["GET"],
  },
  opensubtitles: {
    baseUrl: "https://rest.opensubtitles.org",
    methods: ["GET"],
  },
  febboxSubtitles: {
    baseUrl: "https://fed-subs.pstream.mov",
    methods: ["GET"],
  },
  vdrkSubtitles: {
    baseUrl: "https://sub.vdrk.site",
    methods: ["GET"],
  },
  introDb: {
    baseUrl: "https://api.introdb.app",
    methods: ["GET"],
  },
  theIntroDb: {
    baseUrl: "https://api.theintrodb.org/v1",
    methods: ["GET"],
  },
  fedSkips: {
    baseUrl: "https://fed-skips.pstream.mov",
    methods: ["GET"],
  },
  skipAnalytics: {
    baseUrl: "https://skips.pstream.mov",
    methods: ["POST"],
  },
  ipapi: {
    baseUrl: "https://ipapi.co",
    methods: ["GET"],
  },
  ipinfo: {
    baseUrl: "https://ipinfo.io",
    methods: ["GET"],
  },
  proxyWorker: {
    baseUrl: "",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    includeAuthToken: true,
    includeCookies: true,
    includeReferer: true,
    includeUserAgent: true,
  },
};

const cache = new Map<string, { expiresAt: number; value: unknown }>();

function buildUrl(
  config: ProxyTargetConfig,
  path: string | undefined,
  params: Record<string, string> | undefined,
) {
  const base = config.baseUrl;
  const pathname = path ?? "";

  const url = new URL(
    base
      ? `${base}${pathname.startsWith("/") || pathname.length === 0 ? "" : "/"}${pathname}`
      : pathname,
  );

  Object.entries(params ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url;
}

async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit,
  retries: number,
) {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await fetch(input, init);
    } catch (error) {
      lastError = error;
      attempt += 1;
    }
  }

  throw lastError;
}

export const request = action({
  args: {
    target: v.string(),
    method: v.union(
      v.literal("GET"),
      v.literal("POST"),
      v.literal("PUT"),
      v.literal("PATCH"),
      v.literal("DELETE"),
    ),
    path: v.optional(v.string()),
    params: v.optional(v.record(v.string(), v.string())),
    body: v.optional(v.any()),
    headers: v.optional(v.record(v.string(), v.string())),
    auth: v.optional(
      v.object({
        token: v.optional(v.string()),
        cookies: v.optional(v.string()),
        referer: v.optional(v.string()),
        userAgent: v.optional(v.string()),
      }),
    ),
    timeoutMs: v.optional(v.number()),
    retries: v.optional(v.number()),
    cacheTtlMs: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const config = TARGETS[args.target];
    if (!config) {
      throw new Error(`Proxy target '${args.target}' is not allowlisted.`);
    }

    if (!config.methods.includes(args.method)) {
      throw new Error(
        `Method ${args.method} is not allowed for target '${args.target}'.`,
      );
    }

    const url = buildUrl(config, args.path, args.params);
    const cacheKey = `${args.target}:${args.method}:${url.toString()}:${JSON.stringify(args.body ?? {})}`;

    if (args.cacheTtlMs && args.method === "GET") {
      const cached = cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
      }
    }

    const headers = new Headers({
      ...(config.defaultHeaders ?? {}),
      ...(args.headers ?? {}),
    });

    if (config.includeAuthToken && args.auth?.token)
      headers.set("X-Token", args.auth.token);
    if (config.includeCookies && args.auth?.cookies)
      headers.set("Cookie", args.auth.cookies);
    if (config.includeReferer && args.auth?.referer)
      headers.set("Referer", args.auth.referer);
    if (config.includeUserAgent && args.auth?.userAgent)
      headers.set("User-Agent", args.auth.userAgent);

    if (args.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const timeoutMs = args.timeoutMs ?? 10000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchWithRetry(
        url,
        {
          method: args.method,
          headers,
          body: args.body ? JSON.stringify(args.body) : undefined,
          signal: controller.signal,
        },
        Math.max(0, args.retries ?? 1),
      );

      const contentType = response.headers.get("content-type") ?? "";
      let data: unknown;
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      const normalized = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      };

      if (args.cacheTtlMs && args.method === "GET" && response.ok) {
        cache.set(cacheKey, {
          expiresAt: Date.now() + args.cacheTtlMs,
          value: normalized,
        });
      }

      return normalized;
    } finally {
      clearTimeout(timeout);
    }
  },
});

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("proxy")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

export const set = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("proxy")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return ctx.db.insert("proxy", {
      key: args.key,
      value: args.value,
      updatedAt: Date.now(),
    });
  },
});

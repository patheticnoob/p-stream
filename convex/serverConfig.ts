export interface ServerConfig {
  backendUrls: string[];
  proxyUrls: string[];
  m3u8ProxyUrls: string[];
  tmdbReadApiKey: string | null;
  allowedOrigins: string[];
}

function parseCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

export function getServerConfig(): ServerConfig {
  return {
    backendUrls: parseCsv(process.env.BACKEND_URL),
    proxyUrls: parseCsv(process.env.CORS_PROXY_URL),
    m3u8ProxyUrls: parseCsv(process.env.M3U8_PROXY_URL),
    tmdbReadApiKey: process.env.TMDB_READ_API_KEY ?? null,
    allowedOrigins: parseCsv(process.env.ALLOWED_ORIGINS),
  };
}

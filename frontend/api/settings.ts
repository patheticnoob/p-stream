import { requireConvexClient } from "./convexClient";

export interface SafeSettings {
  language?: string;
  theme?: string | null;
  autoplay?: boolean;
  subtitles?: {
    language?: string;
    native?: boolean;
  };
  accessibility?: {
    lowPerformanceMode?: boolean;
    holdToBoost?: boolean;
    doubleClickToSeek?: boolean;
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

export function sanitizeSafeSettings(input: unknown): SafeSettings {
  const raw = asRecord(input);
  const subtitles = asRecord(raw.subtitles);
  const accessibility = asRecord(raw.accessibility);

  const clean: SafeSettings = {};

  if (typeof raw.language === "string") clean.language = raw.language;
  if (typeof raw.theme === "string" || raw.theme === null) {
    clean.theme = raw.theme;
  }
  if (typeof raw.autoplay === "boolean") clean.autoplay = raw.autoplay;

  if (
    typeof subtitles.language === "string" ||
    typeof subtitles.native === "boolean"
  ) {
    clean.subtitles = {};
    if (typeof subtitles.language === "string") {
      clean.subtitles.language = subtitles.language;
    }
    if (typeof subtitles.native === "boolean") {
      clean.subtitles.native = subtitles.native;
    }
  }

  if (
    typeof accessibility.lowPerformanceMode === "boolean" ||
    typeof accessibility.holdToBoost === "boolean" ||
    typeof accessibility.doubleClickToSeek === "boolean"
  ) {
    clean.accessibility = {};
    if (typeof accessibility.lowPerformanceMode === "boolean") {
      clean.accessibility.lowPerformanceMode = accessibility.lowPerformanceMode;
    }
    if (typeof accessibility.holdToBoost === "boolean") {
      clean.accessibility.holdToBoost = accessibility.holdToBoost;
    }
    if (typeof accessibility.doubleClickToSeek === "boolean") {
      clean.accessibility.doubleClickToSeek = accessibility.doubleClickToSeek;
    }
  }

  return clean;
}

export async function fetchSafeSettings(): Promise<SafeSettings> {
  const data = await requireConvexClient().query(
    "users:getSafeSettings" as any,
    {},
  );
  return sanitizeSafeSettings(data);
}

export async function updateSafeSettings(settings: SafeSettings) {
  const cleanSettings = sanitizeSafeSettings(settings);
  return requireConvexClient().mutation("users:updateSafeSettings" as any, {
    settings: cleanSettings,
  });
}

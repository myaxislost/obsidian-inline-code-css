// src/settings/settings.ts
import { normalize } from "../util/inlineCodeCssMatch";

export interface CodeBlockCssPluginSettings {
  prefixClass: string[];
}

export const DEFAULT_SETTINGS: CodeBlockCssPluginSettings = {
  prefixClass: ["<:dialogue-left", ">:dialogue-right"],
};

export function normalizeSettings(data: unknown): CodeBlockCssPluginSettings {
  const base: CodeBlockCssPluginSettings = { ...DEFAULT_SETTINGS };

  if (!data || typeof data !== "object") return base;

  const raw = data as Partial<CodeBlockCssPluginSettings>;
  const normalized = normalize(raw.prefixClass);

  return { prefixClass: normalized };
}

// settings.ts
export interface VueViteTsPluginSettings {
    prefixClass: string[];
  }
  
  export const DEFAULT_SETTINGS: VueViteTsPluginSettings = {
    prefixClass: [
      "<:dialogue-left",
      ">:dialogue-right"
    ]
  };
  
  export function normalizeSettings(data: unknown): VueViteTsPluginSettings {
    const base: VueViteTsPluginSettings = { ...DEFAULT_SETTINGS };
  
    if (!data || typeof data !== "object") return base;
  
    const raw = data as VueViteTsPluginSettings
    const list = raw.prefixClass
    if (!list || typeof list !== "object") return base;
  
    const out: string[] = [];
    for (const v of list) {
      if (!v) continue;

      const parts = v.split(':')
      if (parts.length < 2) continue;
      out.push(v)
    }
  
    return { prefixClass: out };
  }
  
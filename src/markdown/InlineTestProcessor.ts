// markdown/InlineTestProcessor.ts
import { MarkdownRenderChild, type Plugin } from "obsidian";
import { createApp, type App as VueApp } from "vue";
import InlineTest from "../ui/InlineTest.vue";
import type { VueViteTsPluginSettings } from "../settings/settings";

class InlineTestChild extends MarkdownRenderChild {
  private vueApp: VueApp<Element> | null = null;
  private value: string;
  private clsNames: string[];

  constructor(containerEl: HTMLElement, clsNames: string[], value: string) {
    super(containerEl);
    this.value = value;
    this.clsNames = clsNames
  }

  onload(): void {
    this.vueApp = createApp(InlineTest, { value: this.value, clsNames: this.clsNames });
    this.vueApp.mount(this.containerEl);
  }

  onunload(): void {
    this.vueApp?.unmount();
    this.vueApp = null;
  }
}

type Match = { prefix: string; clsNames: string[]; value: string };

function buildPrefixList(map: string[]): Array<{ prefix: string; clsName: string }> {
  // Normalize + drop empties, then sort so the longest prefix wins
  return map.map(v => {
    const parts = v.split(":")
    return { prefix: parts[0] + ":", clsName: parts[1] }
  })
}

function matchPrefix(raw: string, list: Array<{ prefix: string; clsName: string }>): Match | null {
  const t = raw.trim();
  console.log(t)

  if (!t) return null;
  const parts = t.split(":")
  if (parts.length < 2) return null

  const targetPrefix = `${parts[0]}:`
  const clsNames = []
  for (const { prefix, clsName} of list) {
    if (targetPrefix == prefix) {
      clsNames.push(clsName)
    }
  }


  if (clsNames.length > 0) {
    return { prefix: parts[0], clsNames, value: parts[1] }
  } else {
    return null
  }
}

export function registerInlineTestProcessor(
  plugin: Plugin,
  getSettings: () => VueViteTsPluginSettings
): void {
  plugin.registerMarkdownPostProcessor((el, ctx) => {
    const settings = getSettings();
    const map = settings?.prefixClass ?? [];
    const prefixList = buildPrefixList(map);
    if (prefixList.length === 0) return;

    // Reading view: inline code is <code>, fenced code blocks are <pre><code>
    const codeEls = Array.from(el.querySelectorAll("code"));

    for (const codeEl of codeEls) {
      if (codeEl.parentElement?.tagName === "PRE") continue;

      const raw = codeEl.textContent ?? "";
      const match = matchPrefix(raw, prefixList);
      if (!match) continue;

      const mountEl = document.createElement("span");
      mountEl.style.setProperty("margin", "0")
      codeEl.replaceWith(mountEl);

      ctx.addChild(new InlineTestChild(mountEl, match.clsNames, match.value));
    }
  });
}

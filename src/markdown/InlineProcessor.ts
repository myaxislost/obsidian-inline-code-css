import type { Plugin } from "obsidian";
import type { CodeBlockCssPluginSettings } from "../settings/settings";
import { buildPrefixList, matchPrefix } from "../util/inlineCodeCssMatch";

export function registerInlineProcessor(
  plugin: Plugin,
  getSettings: () => CodeBlockCssPluginSettings
): void {
  plugin.registerMarkdownPostProcessor((el) => {
    const settings = getSettings();
    const map = settings?.prefixClass ?? [];
    const prefixList = buildPrefixList(map);
    if (prefixList.length === 0) return;

    const codeEls = Array.from(el.querySelectorAll("code"));

    for (const codeEl of codeEls) {
      if (codeEl.parentElement?.tagName === "PRE") continue;

      const raw = codeEl.textContent ?? "";
      const match = matchPrefix(raw, prefixList);
      if (!match) continue;


      const span = document.createElement("span");
      span.classList.add("inline-widget");
      for (const c of match.clsNames) span.classList.add(c);

      span.style.setProperty("margin", "0");
      span.textContent = match.value;

      const spanContainer = document.createElement("span")
      spanContainer.appendChild(span)

      codeEl.replaceWith(spanContainer);
    }
  });
}

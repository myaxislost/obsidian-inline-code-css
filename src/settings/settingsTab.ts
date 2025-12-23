// src/settings/settingsTab.ts
import { App, PluginSettingTab, Setting } from "obsidian";
import type VueViteTsPlugin from "../main";
import { split } from "../util/inlineCodeCssMatch";

export class VueViteTsSettingTab extends PluginSettingTab {
  private plugin: VueViteTsPlugin;

  constructor(app: App, plugin: VueViteTsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Inline prefix → CSS class" });

    const entries = this.plugin.settings.prefixClass;

    new Setting(containerEl)
      .setName("Add mapping")
      .setDesc("Adds a new prefix → class mapping. Styling is done in your CSS snippets.")
      .addButton((btn) => {
        btn.setCta();
        btn.setButtonText("Add");
        btn.onClick(async () => {
          this.plugin.settings.prefixClass.push("<:example-class");
          await this.plugin.saveSettings();
          this.display();
        });
      })
      .addButton((btn) => {
        btn.setButtonText("Save");
        btn.onClick(async () => {
          await this.plugin.saveSettings();
          this.display();
        });
      });

    if (entries.length === 0) {
      containerEl.createEl("p", { text: "No mappings yet. Click Add to create one." });
      return;
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i] ?? "";

      const parsed = split(entry) ?? { left: entry, right: "" };
      let prefix = parsed.left;
      let cls = parsed.right;

      const row = new Setting(containerEl).setName("Mapping");

      row.addText((t) => {
        t.setPlaceholder("prefix");
        t.setValue(prefix);
        t.onChange(async (next) => {
          if (next.length === 0) return;

          prefix = next;
          entries[i] = `${prefix}:${cls}`;
        });
      });

      row.addText((t) => {
        t.setPlaceholder("class");
        t.setValue(cls);
        t.onChange(async (next) => {
          if (next.length === 0) return;

          cls = next;
          entries[i] = `${prefix}:${cls}`;
        });
      });

      row.addButton((btn) => {
        btn.setWarning();
        btn.setButtonText("Remove");
        btn.onClick(async () => {
          entries.splice(i, 1);
          await this.plugin.saveSettings();
          this.display();
        });
      });

      row.setDesc("enter prefix:class-name separated by :");
    }
  }
}

// settings/settingsTab.ts
import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type VueViteTsPlugin from "../main";

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
          this.plugin.settings.prefixClass.push("<:example-class")
          await this.plugin.saveSettings();
          this.display();
        });
      })
      .addButton((btn) => {
        btn.setButtonText("Save")
        btn.onClick(async () => {
          await this.plugin.saveSettings();
          this.display();
        })
      })

    if (entries.length === 0) {
      containerEl.createEl("p", { text: "No mappings yet. Click Add to create one." });
      return;
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const parts = entry.split(":")
      const row = new Setting(containerEl).setName("Mapping");

      row.addText((t) => {
        t.setPlaceholder("prefix");
        t.setValue(parts[0]);
        t.onChange(async (next) => {
          if (next.length == 0) return

          entries[i] = `${next}:${parts[1]}`
        });
      });
      
      row.addText((t) => {
        t.setPlaceholder("class");
        t.setValue(parts[1]);
        t.onChange(async (next) => {
          if (next.length == 0) return

          entries[i] = `${parts[0]}:${next}`
        });
      });

      row.addButton((btn) => {
        btn.setWarning();
        btn.setButtonText("Remove");
        btn.onClick(async () => {
          entries.splice(i, 1)
          await this.plugin.saveSettings();
          this.display();
        });
      });

      row.setDesc("enter prefix:class-name separated by :");
    }
  }
}

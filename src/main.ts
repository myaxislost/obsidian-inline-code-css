// main.ts (relevant parts)
import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, normalizeSettings, type VueViteTsPluginSettings } from "./settings/settings";
import { VueViteTsSettingTab } from "./settings/settingsTab";
import { registerInlineTestProcessor } from "./markdown/InlineTestProcessor";

export default class VueViteTsPlugin extends Plugin {
  settings: VueViteTsPluginSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    registerInlineTestProcessor(this, () => this.settings);

    this.addSettingTab(new VueViteTsSettingTab(this.app, this));

    this.addCommand({
      id: "dev-self-reload",
      name:"Dev: self-reload",
      callback: async () => {
        const id = this.manifest.id; window.setTimeout(async () => { 
          // @ts-expect-error: Obsidian's plugin manager is not part of the public API typings. 
          await this.app.plugins.enablePlugin(id); }, 0); 
          // @ts-expect-error: Obsidian's plugin manager is not part of the public API typings. 
          await this.app.plugins.disablePlugin(id); }
    })
  }

  async loadSettings(): Promise<void> {
    const data = await this.loadData();
    console.log(data)
    this.settings = normalizeSettings(data);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

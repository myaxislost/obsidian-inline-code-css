import { Plugin, MarkdownView } from "obsidian";
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  type CodeBlockCssPluginSettings
} from "./settings/settings";
import { VueViteTsSettingTab } from "./settings/settingsTab";
import { registerInlineProcessor } from "./markdown/InlineProcessor";
import { createCodeCssLivePreview } from "./editor/CodeCssLivePreview";

import { Compartment } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

export default class VueViteTsPlugin extends Plugin {
  settings: CodeBlockCssPluginSettings = DEFAULT_SETTINGS;

  private livePreviewCompartment = new Compartment();

  async onload(): Promise<void> {
    await this.loadSettings();

    // Reading / Preview mode processor
    registerInlineProcessor(this, () => this.settings);

    // Live Preview decorator (CM6) 
    this.registerEditorExtension(
      this.livePreviewCompartment.of(
        createCodeCssLivePreview(() => this.settings)
      )
    );

    this.addSettingTab(new VueViteTsSettingTab(this.app, this));

    this.addCommand({
      id: "dev-self-reload",
      name: "Dev: self-reload",
      callback: async () => {
        const id = this.manifest.id;
        window.setTimeout(async () => {
          // @ts-expect-error: Obsidian's plugin manager is not part of the public API typings.
          await this.app.plugins.enablePlugin(id);
        }, 0);
        // @ts-expect-error: Obsidian's plugin manager is not part of the public API typings.
        await this.app.plugins.disablePlugin(id);
      }
    });
  }

  async loadSettings(): Promise<void> {
    const data = await this.loadData();
    this.settings = normalizeSettings(data);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);

    this.reconfigureAllMarkdownEditors();
  }

  private reconfigureAllMarkdownEditors(): void {
    const nextExtension = createCodeCssLivePreview(() => this.settings);

    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const view = leaf.view;
      if (!(view instanceof MarkdownView)) continue;

      const cmMaybe = (view.editor as any)?.cm;

      const cmView: EditorView | null =
        cmMaybe && typeof cmMaybe.dispatch === "function" ? (cmMaybe as EditorView) : null;

      if (!cmView) continue;

      cmView.dispatch({
        effects: this.livePreviewCompartment.reconfigure(nextExtension)
      });
    }
  }
}

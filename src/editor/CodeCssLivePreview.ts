import type { Extension } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";
import type { CodeBlockCssPluginSettings } from "../settings/settings";
import { buildPrefixList, matchPrefix } from "../util/inlineCodeCssMatch";

const DATA_ATTR = "data-inline-code-css-live-marker";

function selectionOverlapsRange(
  view: EditorView,
  from: number,
  to: number
): boolean {
  for (const r of view.state.selection.ranges) {
    const a = Math.min(r.from, r.to);
    const b = Math.max(r.from, r.to);
    if (a < to && b > from) return true;
  }
  return false;
}

function isPrimaryPointerEvent(ev: Event): boolean {
  const pe = ev as PointerEvent;
  if (typeof pe.button === "number") return pe.button === 0;
  return true;
}

class InlineCodeCssWidget extends WidgetType {
  clsNames: string[];
  value: string;
  from: number;
  to: number;
  cursorPos: number;

  constructor(
    clsNames: string[],
    value: string,
    from: number,
    to: number,
    cursorPos: number
  ) {
    super();
    this.clsNames = clsNames;
    this.value = value;
    this.from = from;
    this.to = to;
    this.cursorPos = cursorPos;
  }

  eq(other: InlineCodeCssWidget): boolean {
    if (this.value !== other.value) return false;
    if (this.from !== other.from || this.to !== other.to) return false;
    if (this.cursorPos !== other.cursorPos) return false;

    if (this.clsNames.length !== other.clsNames.length) return false;
    for (let i = 0; i < this.clsNames.length; i++) {
      if (this.clsNames[i] !== other.clsNames[i]) return false;
    }
    return true;
  }

  private enterEdit(view: EditorView, ev: Event): void {
    if (this.cursorPos <= this.from || this.cursorPos >= this.to) return;

    ev.preventDefault();
    ev.stopPropagation();
    if (typeof (ev as any).stopImmediatePropagation === "function") {
      (ev as any).stopImmediatePropagation();
    }

    view.focus();
    view.dispatch({
      selection: { anchor: this.cursorPos },
      scrollIntoView: true,
    });
  }

  toDOM(view: EditorView): HTMLElement {
    const container = document.createElement("span");

    const inner = document.createElement("span");
    inner.classList.add("inline-widget");
    for (const c of this.clsNames) inner.classList.add(c);

    inner.style.setProperty("margin", "0");
    inner.textContent = this.value;
    inner.setAttribute("data-inline-code-css", "1");

    container.appendChild(inner);

    container.addEventListener(
      "pointerdown",
      (ev) => {
        if (!isPrimaryPointerEvent(ev)) return;
        this.enterEdit(view, ev);
      },
      true
    );

    container.addEventListener(
      "mousedown",
      (ev) => {
        const me = ev as MouseEvent;
        if (me.button !== 0) return;
        this.enterEdit(view, ev);
      },
      true
    );

    container.addEventListener(
      "click",
      (ev) => {
        if (!isPrimaryPointerEvent(ev)) return;
        this.enterEdit(view, ev);
      },
      true
    );

    return container;
  }

  ignoreEvent(ev: Event): boolean {
    return (
      ev.type === "pointerdown" ||
      ev.type === "mousedown" ||
      ev.type === "click" ||
      ev.type === "touchstart"
    );
  }
}

export function createCodeCssLivePreview(
  getSettings: () => CodeBlockCssPluginSettings
): Extension {
  const inlineCodeRegex = /(`+)([^\n]*?)\1/g;

  const makeDecorator = (): MatchDecorator => {
    const settings = getSettings();
    const prefixList = buildPrefixList(settings?.prefixClass ?? []);

    return new MatchDecorator({
      regexp: inlineCodeRegex,
      decoration: (match, view, pos) => {
        const isLivePreview = view.state.field(editorLivePreviewField, false);
        if (!isLivePreview) return null;

        if (prefixList.length === 0) return null;

        const fence = match[1] ?? "";
        const inside = match[2] ?? "";

        const m = matchPrefix(inside, prefixList);
        if (!m) return null;

        const from = pos;
        const to = pos + (match[0]?.length ?? 0);

        if (selectionOverlapsRange(view, from, to)) return null;

        const cursorPos = from + fence.length;

        return Decoration.replace({
          widget: new InlineCodeCssWidget(
            m.clsNames,
            m.value,
            from,
            to,
            cursorPos
          ),
          inclusive: false,
        });
      },
    });
  };

  return ViewPlugin.fromClass(
    class InlineCodeCssLivePreview {
      decorations: DecorationSet;
      private decorator: MatchDecorator;

      constructor(view: EditorView) {
        view.dom.setAttribute(DATA_ATTR, "1");
        this.decorator = makeDecorator();
        this.decorations = this.decorator.createDeco(view);
      }

      update(update: ViewUpdate): void {
        if (update.selectionSet) {
          this.decorations = this.decorator.createDeco(update.view);
          return;
        }

        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.decorator.updateDeco(
            update,
            this.decorations
          );
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

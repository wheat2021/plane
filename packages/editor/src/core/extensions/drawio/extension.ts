import { Node, mergeAttributes, textblockTypeInputRule } from "@tiptap/core";
import { Fragment } from "@tiptap/pm/model";
import { ReactNodeViewRenderer } from "@tiptap/react";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local imports
import { DrawioBlockNodeView } from "./node-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.DRAWIO_BLOCK]: {
      setDrawioBlock: () => ReturnType;
    };
  }
}

export const drawioInputRegex = /^```drawio[\s\n]$/;

export const DrawioBlockExtension = Node.create({
  name: CORE_EXTENSIONS.DRAWIO_BLOCK,
  group: "block",
  content: "text*",
  marks: "",
  code: true,
  defining: true,
  draggable: true,
  selectable: true,

  parseHTML() {
    return [
      {
        tag: 'pre[data-type="drawioBlock"]',
        priority: 100,
        preserveWhitespace: "full",
        getContent: (node, schema) => {
          const el = node as HTMLElement;
          const b64 = el.getAttribute("data-content");
          if (b64) {
            try {
              const xml = decodeURIComponent(escape(atob(b64)));
              if (xml) return Fragment.from(schema.text(xml));
            } catch {
              // fall through to text content
            }
          }
          const text = el.textContent ?? "";
          return text ? Fragment.from(schema.text(text)) : Fragment.empty;
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const xml = node.textContent;
    const b64 = xml ? btoa(unescape(encodeURIComponent(xml))) : "";
    return [
      "pre",
      mergeAttributes(HTMLAttributes, {
        "data-type": "drawioBlock",
        "data-content": b64,
      }),
      ["code", { class: "language-drawio" }, 0],
    ];
  },

  addCommands() {
    return {
      setDrawioBlock:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, content: [] }),
    };
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: drawioInputRegex,
        type: this.type,
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      ArrowDown: ({ editor }) => {
        const { state } = editor;
        const { selection, doc } = state;
        const { $from, empty } = selection;

        if (!empty || $from.parent.type !== this.type) {
          return false;
        }

        const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;
        if (!isAtEnd) return false;

        const after = $from.after();
        if (after === undefined) return false;

        const nodeAfter = doc.nodeAt(after);
        if (nodeAfter) return false;

        return editor.commands.exitCode();
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(DrawioBlockNodeView);
  },
});

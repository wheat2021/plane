import { Node, mergeAttributes, textblockTypeInputRule } from "@tiptap/core";
import { Fragment } from "@tiptap/pm/model";
import { ReactNodeViewRenderer } from "@tiptap/react";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local imports
import { MermaidBlockNodeView } from "./node-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.MERMAID_BLOCK]: {
      setMermaidBlock: () => ReturnType;
    };
  }
}

export const mermaidInputRegex = /^```mermaid[\s\n]$/;

export const MermaidBlockExtension = Node.create({
  name: CORE_EXTENSIONS.MERMAID_BLOCK,
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
        tag: 'pre[data-type="mermaidBlock"]',
        priority: 100, // higher than codeBlock default 50, ensures we match before codeBlock's `pre` rule
        preserveWhitespace: "full",
        getContent: (node, schema) => {
          const el = node as HTMLElement;
          const b64 = el.getAttribute("data-content");
          if (b64) {
            try {
              const text = decodeURIComponent(escape(atob(b64)));
              if (text) return Fragment.from(schema.text(text));
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
    const text = node.textContent;
    const b64 = text ? btoa(unescape(encodeURIComponent(text))) : "";
    return [
      "pre",
      mergeAttributes(HTMLAttributes, {
        "data-type": "mermaidBlock",
        "data-content": b64,
      }),
      ["code", { class: "language-mermaid" }, 0],
    ];
  },

  addCommands() {
    return {
      setMermaidBlock:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, content: [] }),
    };
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: mermaidInputRegex,
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
    return ReactNodeViewRenderer(MermaidBlockNodeView);
  },
});

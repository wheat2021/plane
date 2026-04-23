import type { EditorProps } from "@tiptap/pm/view";
// plane utils
import { cn } from "@plane/utils";
// helpers
import { processAssetDuplication } from "@/helpers/paste-asset";

type TArgs = {
  editorClassName: string;
};

export const CoreEditorProps = (props: TArgs): EditorProps => {
  const { editorClassName } = props;

  return {
    attributes: {
      class: cn(
        "prose prose-brand max-w-full prose-headings:font-display font-default focus:outline-none",
        editorClassName
      ),
    },
    handleDOMEvents: {
      keydown: (_view, event) => {
        // prevent default event listeners from firing when slash command is active
        if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
          const slashCommand = document.querySelector("#slash-command");
          if (slashCommand) {
            return true;
          }
        }
      },
    },
    handlePaste: (view, event) => {
      if (!event.clipboardData) return false;

      const types = Array.from(event.clipboardData.types);

      // Fix for large markdown paste: tiptap-markdown's clipboardTextParser produces
      // a Slice with non-zero openStart/openEnd, causing ProseMirror's replaceSelection
      // fitting algorithm to silently drop content from large documents.
      // We intercept plain-text pastes, get the parsed Slice, and insert its content
      // directly via tr.replaceWith to bypass the lossy fitting.
      if (types.includes("text/plain") && !types.includes("text/html")) {
        const text = event.clipboardData.getData("text/plain");
        for (const p of view.state.plugins) {
          const parserFn =
            (p as any).props?.clipboardTextParser || (p as any).spec?.props?.clipboardTextParser;
          if (parserFn) {
            const $context = view.state.selection.$from;
            const slice = parserFn(text, $context, false, view);
            if (slice && slice.content.childCount > 0 && (slice.openStart > 0 || slice.openEnd > 0)) {
              const tr = view.state.tr;
              const { from, to } = tr.selection;
              const $pos = tr.doc.resolve(from);
              const parentNode = $pos.parent;
              const isEmptyParagraph = parentNode.type.name === "paragraph" && parentNode.content.size === 0;
              if (from !== to) {
                tr.replaceWith(from, to, slice.content);
              } else if (isEmptyParagraph) {
                tr.replaceWith($pos.start($pos.depth) - 1, $pos.end($pos.depth) + 1, slice.content);
              } else {
                tr.insert($pos.after($pos.depth), slice.content);
              }
              view.dispatch(tr.scrollIntoView().setMeta("paste", true).setMeta("uiEvent", "paste"));
              event.preventDefault();
              return true;
            }
            break;
          }
        }
      }

      const htmlContent = event.clipboardData.getData("text/plane-editor-html");
      if (!htmlContent) return false;

      const { processedHtml } = processAssetDuplication(htmlContent);
      view.pasteHTML(processedHtml);
      return true;
    },
  };
};

import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
// plane utils
import { cn } from "@plane/utils";

export function MermaidBlockNodeView({ editor, node, getPos }: NodeViewProps) {
  // Show code when cursor is inside the node; show rendered graph when cursor is outside.
  // This works regardless of editor.isEditable (Plane's description editor is always editable).
  const [showCode, setShowCode] = useState(() => {
    // Initially show code if cursor is already inside this node
    const pos = getPos();
    if (typeof pos !== "number") return true;
    const { selection } = editor.state;
    return selection.$from.pos >= pos && selection.$from.pos <= pos + node.nodeSize;
  });

  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const renderIdRef = useRef(0);

  // Track cursor position via transactions to toggle between code and graph view
  useEffect(() => {
    const handleTransaction = () => {
      const pos = getPos();
      if (typeof pos !== "number") return;
      const { selection } = editor.state;
      const isCursorInside = selection.$from.pos >= pos && selection.$from.pos <= pos + node.nodeSize;
      setShowCode(isCursorInside);
    };
    editor.on("transaction", handleTransaction);
    return () => {
      editor.off("transaction", handleTransaction);
    };
  }, [editor, getPos, node.nodeSize]);

  const code = node.textContent;

  useEffect(() => {
    if (showCode || !code.trim()) {
      setSvg("");
      setError("");
      return;
    }

    const renderId = ++renderIdRef.current;
    setLoading(true);
    setSvg("");
    setError("");

    const render = async () => {
      try {
        const m = await import("mermaid");
        if (renderId !== renderIdRef.current) return;

        m.default.initialize({ startOnLoad: false, suppressErrorRendering: true });
        const uniqueId = `mermaid-${Date.now()}-${renderId}`;
        const { svg: renderedSvg } = await m.default.render(uniqueId, code);

        if (renderId !== renderIdRef.current) return;
        setSvg(renderedSvg);
      } catch {
        if (renderId !== renderIdRef.current) return;
        setError("Mermaid 图表语法错误，请检查代码");
      } finally {
        if (renderId === renderIdRef.current) setLoading(false);
      }
    };

    void render();
  }, [showCode, code]);

  // When user clicks the rendered graph, move cursor into the node so they can edit
  const handleGraphClick = () => {
    const pos = getPos();
    if (typeof pos !== "number") return;
    editor
      .chain()
      .focus()
      .setTextSelection(pos + 1)
      .run();
  };

  return (
    <NodeViewWrapper className="mermaid-block my-2">
      {showCode ? (
        <div className="border border-subtle rounded-lg overflow-hidden bg-layer-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-subtle bg-layer-2">
            <span className="text-xs font-medium text-tertiary">Mermaid 图表</span>
          </div>
          <NodeViewContent
            as="code"
            className="block whitespace-pre-wrap font-mono text-sm text-primary p-4 outline-none"
          />
        </div>
      ) : (
        <div
          className={cn("rounded-lg overflow-auto cursor-pointer", { "p-4 bg-layer-2": !svg || error || loading })}
          role="button"
          tabIndex={0}
          onClick={handleGraphClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleGraphClick();
          }}
          title="点击编辑 Mermaid 代码"
        >
          {loading && !svg && <div className="text-sm text-tertiary py-2">正在渲染图表...</div>}
          {error && <div className="text-sm text-error-primary py-2">{error}</div>}
          {!code.trim() && !loading && <div className="text-sm text-tertiary py-2">空的 Mermaid 图表（点击编辑）</div>}
          {svg && (
            <div
              className="flex justify-center"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: mermaid renders trusted SVG from user's own content
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
}

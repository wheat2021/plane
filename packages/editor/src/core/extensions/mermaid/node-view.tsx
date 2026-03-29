import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { Eye, Pencil } from "lucide-react";
// plane utils
import { cn } from "@plane/utils";

export function MermaidBlockNodeView({ node }: NodeViewProps) {
  // User explicitly toggles between code-edit mode and graph-preview mode
  const [showPreview, setShowPreview] = useState(false);

  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const renderIdRef = useRef(0);

  const code = node.textContent;

  useEffect(() => {
    if (!showPreview || !code.trim()) {
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
      } catch (e) {
        if (renderId !== renderIdRef.current) return;
        const msg = e instanceof Error ? e.message : String(e);
        // mermaid error messages can be verbose HTML — strip tags and truncate
        const plain = msg.replace(/<[^>]*>/g, "").trim();
        setError(plain ? `语法错误：${plain.slice(0, 300)}` : "Mermaid 图表语法错误，请检查代码");
      } finally {
        if (renderId === renderIdRef.current) setLoading(false);
      }
    };

    void render();
  }, [showPreview, code]);

  return (
    <NodeViewWrapper className="mermaid-block my-2">
      <div className="border border-subtle rounded-lg overflow-hidden bg-layer-3">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-subtle bg-layer-2">
          <span className="text-xs font-medium text-tertiary">Mermaid 图表</span>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="flex items-center gap-1 text-xs text-tertiary hover:text-primary transition-colors px-2 py-0.5 rounded hover:bg-layer-3"
          >
            {showPreview ? (
              <>
                <Pencil className="size-3" />
                编辑
              </>
            ) : (
              <>
                <Eye className="size-3" />
                预览
              </>
            )}
          </button>
        </div>

        {/* Code editor */}
        {!showPreview && (
          <NodeViewContent
            as="code"
            className="block whitespace-pre-wrap font-mono text-sm text-primary p-4 outline-none min-h-[3rem]"
          />
        )}

        {/* Graph preview */}
        {showPreview && (
          <div className={cn("p-4", { "bg-layer-2": !svg || error || loading })}>
            {loading && !svg && <div className="text-sm text-tertiary py-2">正在渲染图表...</div>}
            {error && <div className="text-sm text-error-primary py-2">{error}</div>}
            {!code.trim() && !loading && <div className="text-sm text-tertiary py-2">空的 Mermaid 图表</div>}
            {svg && (
              <div
                className="flex justify-center"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: mermaid renders trusted SVG from user's own content
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

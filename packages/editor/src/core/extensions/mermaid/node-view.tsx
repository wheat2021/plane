import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { Code2, Eye } from "lucide-react";
// plane utils
import { cn } from "@plane/utils";

export function MermaidBlockNodeView({ node }: NodeViewProps) {
  const code = node.textContent;
  const hasContent = code.trim().length > 0;
  const [showPreview, setShowPreview] = useState(hasContent);

  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const renderIdRef = useRef(0);

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
        const plain = msg.replace(/<[^>]*>/g, "").trim();
        setError(plain ? `语法错误：${plain.slice(0, 300)}` : "Mermaid 图表语法错误，请检查代码");
      } finally {
        if (renderId === renderIdRef.current) setLoading(false);
      }
    };

    void render();
  }, [showPreview, code]);

  const toolbar = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setShowPreview(true)}
        className={cn(
          "flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors",
          showPreview ? "text-primary bg-layer-3" : "text-tertiary hover:text-primary hover:bg-layer-3"
        )}
      >
        <Eye className="size-3" />
        预览
      </button>
      <button
        type="button"
        onClick={() => setShowPreview(false)}
        className={cn(
          "flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors",
          !showPreview ? "text-primary bg-layer-3" : "text-tertiary hover:text-primary hover:bg-layer-3"
        )}
      >
        <Code2 className="size-3" />
        代码
      </button>
    </div>
  );

  return (
    <NodeViewWrapper className="mermaid-block my-2">
      {showPreview && (
        <div className="group relative">
          <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-layer-2 border border-subtle rounded-md shadow-sm px-1 py-0.5">
            {toolbar}
          </div>
          {loading && !svg && <div className="text-sm text-tertiary py-4 px-3">正在渲染图表...</div>}
          {error && <div className="text-sm text-error-primary py-4 px-3">{error}</div>}
          {!code.trim() && !loading && <div className="text-sm text-tertiary py-4 px-3">空的 Mermaid 图表</div>}
          {svg && (
            <div
              className="flex justify-center"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: mermaid renders trusted SVG from user's own content
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          )}
        </div>
      )}
      <div
        className={cn(
          "border border-subtle rounded-lg overflow-hidden",
          showPreview && "absolute -left-[9999px] h-0 overflow-hidden"
        )}
      >
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-subtle bg-layer-2">
          <span className="text-xs font-medium text-tertiary">Mermaid 图表</span>
          {!showPreview && toolbar}
        </div>
        <NodeViewContent
          as="code"
          className="block whitespace-pre-wrap font-mono text-sm text-primary p-4 outline-none min-h-[3rem]"
        />
      </div>
    </NodeViewWrapper>
  );
}

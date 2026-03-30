import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Code2, Eye, Pencil, X } from "lucide-react";
// plane utils
import { cn } from "@plane/utils";

type TDrawioMode = "source" | "preview" | "edit";

function isValidMxfile(xml: string): boolean {
  const trimmed = xml.trim();
  return trimmed.startsWith("<mxfile") && trimmed.endsWith("</mxfile>");
}

function DrawioEditorModal({
  xml,
  onSave,
  onClose,
}: {
  xml: string;
  onSave: (xml: string) => void;
  onClose: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      if (event.source !== iframe.contentWindow) return;

      let data: { event?: string; xml?: string } = {};
      try {
        data = typeof event.data === "string" ? (JSON.parse(event.data) as typeof data) : (event.data as typeof data);
      } catch {
        return;
      }

      if (data.event === "init") {
        setReady(true);
        iframe.contentWindow?.postMessage(
          JSON.stringify({ action: "load", xml: xml || "<mxfile><diagram></diagram></mxfile>" }),
          "*"
        );
      } else if (data.event === "save") {
        if (data.xml) onSave(data.xml);
      } else if (data.event === "exit") {
        onClose();
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [xml, onSave, onClose]);

  return (
    <div className="fixed inset-0 z-[999] flex flex-col bg-layer-1">
      <div className="flex items-center justify-between px-4 py-2 border-b border-subtle bg-layer-2">
        <span className="text-sm font-medium text-primary">Draw.io 编辑器</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-layer-3 text-tertiary hover:text-primary transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
      <iframe
        ref={iframeRef}
        title="Draw.io Editor"
        className="flex-1 w-full border-0"
        src="/drawio/?embed=1&spin=1&proto=json&saveAndExit=1&noSaveBtn=0&noExitBtn=0"
      />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-layer-1/80">
          <span className="text-sm text-tertiary">正在加载 Draw.io 编辑器...</span>
        </div>
      )}
    </div>
  );
}

export function DrawioBlockNodeView({ node }: NodeViewProps) {
  const [mode, setMode] = useState<TDrawioMode>("source");
  const [error, setError] = useState("");
  const [showEditor, setShowEditor] = useState(false);

  const code = node.textContent;

  const handleSwitchToPreview = useCallback(() => {
    if (!code.trim()) {
      setError("请输入 Draw.io XML 内容");
      return;
    }
    if (!isValidMxfile(code)) {
      setError("仅接受 mxfile 格式 XML，请确保内容以 <mxfile 开头并以 </mxfile> 结尾");
      return;
    }
    setError("");
    setMode("preview");
  }, [code]);

  const handleSwitchToSource = useCallback(() => {
    setError("");
    setMode("source");
  }, []);

  const handleOpenEditor = useCallback(() => {
    if (code.trim() && !isValidMxfile(code)) {
      setError("仅接受 mxfile 格式 XML，无法打开编辑器");
      return;
    }
    setError("");
    setShowEditor(true);
  }, [code]);

  const handleEditorSave = useCallback((_xml: string) => {
    setShowEditor(false);
  }, []);

  const handleEditorClose = useCallback(() => {
    setShowEditor(false);
  }, []);

  return (
    <NodeViewWrapper className="drawio-block my-2">
      <div className="border border-subtle rounded-lg overflow-hidden bg-layer-3">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-subtle bg-layer-2">
          <span className="text-xs font-medium text-tertiary">Draw.io 图表</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleOpenEditor}
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors",
                mode === "edit" ? "text-primary bg-layer-3" : "text-tertiary hover:text-primary hover:bg-layer-3"
              )}
            >
              <Pencil className="size-3" />
              编辑
            </button>
            <button
              type="button"
              onClick={handleSwitchToPreview}
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors",
                mode === "preview" ? "text-primary bg-layer-3" : "text-tertiary hover:text-primary hover:bg-layer-3"
              )}
            >
              <Eye className="size-3" />
              预览
            </button>
            <button
              type="button"
              onClick={handleSwitchToSource}
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors",
                mode === "source" ? "text-primary bg-layer-3" : "text-tertiary hover:text-primary hover:bg-layer-3"
              )}
            >
              <Code2 className="size-3" />
              源代码
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-3 py-1.5 text-xs text-error-primary bg-error-subtle border-b border-subtle">{error}</div>
        )}

        {/* Source code editor */}
        {mode === "source" && (
          <NodeViewContent
            as="code"
            className="block whitespace-pre-wrap font-mono text-sm text-primary p-4 outline-none min-h-[3rem]"
          />
        )}

        {/* Preview mode */}
        {mode === "preview" && (
          <div className="p-4">
            {!code.trim() ? (
              <div className="text-sm text-tertiary py-2">空的 Draw.io 图表</div>
            ) : (
              <DrawioPreview key={code} xml={code} />
            )}
          </div>
        )}
      </div>

      {/* Full-screen modal editor */}
      {showEditor && <DrawioEditorModal xml={code} onSave={handleEditorSave} onClose={handleEditorClose} />}
    </NodeViewWrapper>
  );
}

function DrawioPreview({ xml }: { xml: string }) {
  const src = `/drawio/?lightbox=1&highlight=0000ff&nav=1#R${encodeURIComponent(xml)}`;

  return <iframe title="Draw.io Preview" className="w-full border-0 rounded" style={{ height: "400px" }} src={src} />;
}

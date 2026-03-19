"use client";

import type { FC, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[0].startsWith("**")) parts.push(<strong key={m.index}>{m[2]}</strong>);
    else parts.push(<em key={m.index}>{m[3] ?? m[4]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function SimpleMarkdown({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={i} className="flex gap-1.5 leading-snug">
              <span>•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        if (line === "") return <div key={i} className="h-1.5" />;
        return <div key={i}>{renderInline(line)}</div>;
      })}
    </>
  );
}

type Props = {
  description: string;
  /** Which side the popover opens toward. Default: "left" (popover anchored at left edge of icon). Use "right" when the icon is on the far right to avoid clipping. */
  align?: "left" | "right";
};

export const ExtraPropertyDescriptionPopover: FC<Props> = ({ description, align = "left" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center self-center">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center text-custom-text-400 hover:text-custom-text-300 transition-colors"
      >
        <Info className="size-3.5" />
      </button>
      {open && (
        <div
          className={`absolute top-6 z-[200] w-80 rounded-md border border-custom-border-200 p-2.5 shadow-md text-xs text-custom-text-200 leading-relaxed select-text max-h-48 overflow-y-auto ${align === "right" ? "right-0" : "left-0"}`}
          style={{ backgroundColor: "var(--color-background-100, #fff)" }}
        >
          <SimpleMarkdown text={description} />
        </div>
      )}
    </div>
  );
};

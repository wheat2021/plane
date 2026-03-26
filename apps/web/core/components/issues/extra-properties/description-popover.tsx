"use client";

import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { SimpleMarkdown } from "./simple-markdown";

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

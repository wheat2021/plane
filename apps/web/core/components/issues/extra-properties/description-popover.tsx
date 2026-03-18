import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

export const ExtraPropertyDescriptionPopover: FC<{ description: string }> = ({ description }) => {
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
    <div ref={ref} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center text-tertiary hover:text-secondary transition-colors"
      >
        <Info className="size-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-5 z-50 w-80 rounded-md border border-subtle bg-layer-2 p-2.5 shadow-lg text-xs text-secondary leading-relaxed select-text max-h-48 overflow-y-auto whitespace-pre-wrap">
          {description}
        </div>
      )}
    </div>
  );
};

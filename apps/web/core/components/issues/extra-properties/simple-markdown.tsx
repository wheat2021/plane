"use client";

import type { ReactNode } from "react";

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

export function SimpleMarkdown({ text }: { text: string }) {
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

"use client";

import { useMemo, useState } from "react";
import * as icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "@plane/i18n";

type TLucideIconPickerProps = {
  value: string;
  onChange: (iconName: string) => void;
  color?: string;
};

// Convert PascalCase to kebab-case for display
function toKebabCase(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

// Get all valid Lucide icon names (filter out non-component exports)
const LUCIDE_ICON_NAMES: string[] = Object.keys(icons)
  .filter((key) => {
    const val = (icons as unknown as Record<string, unknown>)[key];
    return typeof val === "function" && key !== "createLucideIcon" && /^[A-Z]/.test(key);
  })
  .map(toKebabCase)
  .sort();

function toPascalCase(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function LucideIconPicker({ value, onChange, color = "#6b7280" }: TLucideIconPickerProps) {
  const [query, setQuery] = useState("");
  const { t } = useTranslation();

  const filteredIcons = useMemo(() => {
    if (!query.trim()) return [];
    return LUCIDE_ICON_NAMES.filter((name) => name.includes(query.toLowerCase().trim())).slice(0, 50);
  }, [query]);

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("workspace_settings.settings.work_item_types.icon_search_placeholder")}
        className="w-full rounded border border-custom-border-200 bg-custom-background-100 px-3 py-1.5 text-sm text-custom-text-100 placeholder-custom-text-400 focus:outline-none focus:ring-1 focus:ring-custom-primary-100"
      />
      {query.trim() === "" ? (
        <p className="py-2 text-center text-xs text-custom-text-400">
          {t("workspace_settings.settings.work_item_types.icon_search_hint")}
        </p>
      ) : filteredIcons.length === 0 ? (
        <p className="py-2 text-center text-xs text-custom-text-400">
          {t("workspace_settings.settings.work_item_types.icon_no_results")}
        </p>
      ) : (
        <div className="grid max-h-48 grid-cols-6 gap-1 overflow-y-auto">
          {filteredIcons.map((iconName) => {
            const key = toPascalCase(iconName);
            const IconComponent = (icons as unknown as Record<string, LucideIcon>)[key];
            if (!IconComponent) return null;
            const isSelected = value === iconName;
            return (
              <button
                key={iconName}
                type="button"
                title={iconName}
                onClick={() => onChange(iconName)}
                className={`flex items-center justify-center rounded p-1.5 hover:bg-custom-background-80 ${
                  isSelected ? "bg-custom-primary-100/20 ring-1 ring-custom-primary-100" : ""
                }`}
              >
                <IconComponent size={16} color={isSelected ? color : "#6b7280"} strokeWidth={2} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

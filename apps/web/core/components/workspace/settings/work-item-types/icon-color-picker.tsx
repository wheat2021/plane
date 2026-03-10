"use client";

import { useState } from "react";
import { useTranslation } from "@plane/i18n";
import { LucideIconPicker } from "./lucide-icon-picker";

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
  "#0f172a", // slate-900
  "#78716c", // stone
  "#84cc16", // lime
];

function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export type TIconColorValue = {
  name: string;
  color: string;
};

type TIconColorPickerProps = {
  value: TIconColorValue;
  onChange: (value: TIconColorValue) => void;
};

export function IconColorPicker({ value, onChange }: TIconColorPickerProps) {
  const [hexInput, setHexInput] = useState(value.color);
  const [hexError, setHexError] = useState(false);
  const { t } = useTranslation();

  const handleColorSelect = (color: string) => {
    setHexInput(color);
    setHexError(false);
    onChange({ ...value, color });
  };

  const handleHexInput = (input: string) => {
    setHexInput(input);
    if (isValidHex(input)) {
      setHexError(false);
      onChange({ ...value, color: input });
    } else {
      setHexError(true);
    }
  };

  const handleIconChange = (iconName: string) => {
    onChange({ ...value, name: iconName });
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1.5 text-xs font-medium text-custom-text-200">
          {t("workspace_settings.settings.work_item_types.select_icon")}
        </p>
        <LucideIconPicker value={value.name} onChange={handleIconChange} color={value.color} />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-custom-text-200">
          {t("workspace_settings.settings.work_item_types.select_color")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleColorSelect(color)}
              style={{ backgroundColor: color }}
              className={`size-6 rounded-full border-2 transition-transform hover:scale-110 ${
                value.color === color ? "border-custom-text-100" : "border-transparent"
              }`}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-custom-text-300">HEX</span>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexInput(e.target.value)}
            placeholder="#000000"
            maxLength={7}
            className={`w-28 rounded border px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 ${
              hexError
                ? "border-red-500 focus:ring-red-500 text-red-500"
                : "border-custom-border-200 focus:ring-custom-primary-100 text-custom-text-100"
            } bg-custom-background-100`}
          />
          {value.color && isValidHex(value.color) && (
            <div
              className="size-5 rounded-full border border-custom-border-200"
              style={{ backgroundColor: value.color }}
            />
          )}
        </div>
        {hexError && (
          <p className="mt-1 text-xs text-red-500">{t("workspace_settings.settings.work_item_types.invalid_hex")}</p>
        )}
      </div>
    </div>
  );
}

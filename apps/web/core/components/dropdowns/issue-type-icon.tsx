import type { ReactNode } from "react";
import * as icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CircleCheck } from "lucide-react";
import type { TIssueTypeLogoProps } from "@plane/types";

// Default icon color (gray)
export const DEFAULT_ISSUE_TYPE_COLOR = "#6b7280";

/**
 * Convert kebab-case icon name to PascalCase component name
 * e.g. "circle-check" → "CircleCheck"
 */
function toPascalCase(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Render a Lucide icon component by kebab-case name
 */
function renderLucideIcon(iconName: string, size: number, color: string): ReactNode {
  const key = toPascalCase(iconName);
  const IconComponent = (icons as unknown as Record<string, LucideIcon>)[key];
  if (!IconComponent) {
    return <CircleCheck size={size} color={color} strokeWidth={2} />;
  }
  return <IconComponent size={size} color={color} strokeWidth={2} />;
}

/**
 * Get icon for issue type, reading from logo_props when available.
 * Falls back to default icon when logo_props is empty or icon name is unknown.
 */
export function getIssueTypeIconFromProps(logoProps: TIssueTypeLogoProps | null | undefined, size = 14): ReactNode {
  const iconName = logoProps?.icon?.name;
  const iconColor = logoProps?.icon?.color ?? DEFAULT_ISSUE_TYPE_COLOR;

  if (iconName) {
    return renderLucideIcon(iconName, size, iconColor);
  }

  return <CircleCheck size={size} color={DEFAULT_ISSUE_TYPE_COLOR} strokeWidth={2} />;
}

/**
 * Get icon for issue type based on name (legacy fallback)
 * @deprecated Prefer getIssueTypeIconFromProps which reads from logo_props
 */
export function getIssueTypeIcon(name: string, color?: string, size = 14): ReactNode {
  const iconColor = color ?? DEFAULT_ISSUE_TYPE_COLOR;
  return renderLucideIcon(name, size, iconColor);
}

/**
 * Get default issue type icon (CircleCheck with gray color)
 */
export function getDefaultIssueTypeIcon(size = 14): ReactNode {
  return <CircleCheck size={size} color={DEFAULT_ISSUE_TYPE_COLOR} strokeWidth={2} />;
}

import type { ReactNode } from "react";
import { FileText, BookOpen, Bug, CircleCheck } from "lucide-react";

// Default icon color (gray)
export const DEFAULT_ISSUE_TYPE_COLOR = "#6b7280";

/**
 * Get icon for issue type based on name
 */
export function getIssueTypeIcon(name: string, color?: string, size = 14): ReactNode {
  const iconProps = { size, color: color ?? DEFAULT_ISSUE_TYPE_COLOR, strokeWidth: 2 };

  switch (name.toLowerCase()) {
    case "task":
      return <CircleCheck {...iconProps} />;
    case "requirement":
      return <FileText {...iconProps} />;
    case "story":
      return <BookOpen {...iconProps} />;
    case "bug":
      return <Bug {...iconProps} />;
    default:
      return <CircleCheck {...iconProps} />;
  }
}

/**
 * Get default issue type icon (Task with gray color)
 */
export function getDefaultIssueTypeIcon(size = 14): ReactNode {
  return <CircleCheck size={size} color={DEFAULT_ISSUE_TYPE_COLOR} strokeWidth={2} />;
}

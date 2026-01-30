import type { ReactNode } from "react";
import { FileText, BookOpen, Bug } from "lucide-react";

/**
 * Get icon for issue type based on name
 */
export function getIssueTypeIcon(name: string, color?: string, size = 14): ReactNode {
  const iconProps = { size, color: color ?? "#6b7280", strokeWidth: 2 };

  switch (name.toLowerCase()) {
    case "requirement":
      return <FileText {...iconProps} />;
    case "story":
      return <BookOpen {...iconProps} />;
    case "bug":
      return <Bug {...iconProps} />;
    default:
      return <FileText {...iconProps} />;
  }
}

import type { ReactNode } from "react";
// plane imports (A2: use upstream Logo component from propel)
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { TIssueTypeLogoProps } from "@plane/types";

export const DEFAULT_ISSUE_TYPE_COLOR = "#6b7280";

const DEFAULT_LOGO: TIssueTypeLogoProps = {
  in_use: "icon",
  icon: { name: "circle-check", color: DEFAULT_ISSUE_TYPE_COLOR },
};

/** Render issue type icon using upstream Logo component (uses logo_props system). */
export function getIssueTypeIconFromProps(logoProps: TIssueTypeLogoProps | null | undefined, size = 14): ReactNode {
  return <Logo logo={logoProps ?? DEFAULT_LOGO} size={size} />;
}

/** @deprecated Use getIssueTypeIconFromProps */
export function getIssueTypeIcon(name: string, color?: string, size = 14): ReactNode {
  return <Logo logo={{ in_use: "icon", icon: { name, color: color ?? DEFAULT_ISSUE_TYPE_COLOR } }} size={size} />;
}

export function getDefaultIssueTypeIcon(size = 14): ReactNode {
  return <Logo logo={DEFAULT_LOGO} size={size} />;
}

/**
 * Logo properties for issue type icons
 */
export type TIssueTypeLogoProps = {
  icon?: {
    name: string;
    color: string;
  };
  emoji?: {
    value: string;
  };
};

/**
 * Issue type definition
 */
export type TIssueType = {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  logo_props: TIssueTypeLogoProps;
  is_default: boolean;
  is_active: boolean;
  level: number;
};

/**
 * Lite version of issue type for dropdowns
 */
export type TIssueTypeLite = Pick<TIssueType, "id" | "name" | "logo_props" | "is_default">;

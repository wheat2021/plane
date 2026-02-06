/**
 * Extra Property Types
 *
 * Types for configuring and storing additional properties on work items
 * based on their issue type configuration.
 */

/**
 * Supported input control types for extra properties.
 */
export type TExtraPropertyType = "text" | "textarea" | "select" | "multiselect" | "checkbox" | "markdown";

/**
 * Option for select/multiselect property types.
 */
export interface TExtraPropertyOption {
  /** The value stored when this option is selected */
  value: string;
  /** Display label (defaults to value if not provided) */
  label?: string;
  /** Whether this option is selected by default */
  isDefault?: boolean;
}

/**
 * Configuration for an extra property on an issue type.
 */
export interface TExtraPropertyConfig {
  /** Unique identifier */
  id: string;
  /** ID of the issue type this property belongs to */
  issue_type: string;
  /** ID of the workspace */
  workspace: string;
  /** Unique key identifier within the issue type (alphanumeric with underscores) */
  key: string;
  /** Display label for the property */
  label: string;
  /** Type of input control */
  type: TExtraPropertyType;
  /** Optional description/help text */
  description?: string;
  /** Whether this property is required */
  required?: boolean;
  /** Sort order for display */
  sort_order: number;
  /** Options for select/multiselect types */
  options?: TExtraPropertyOption[];
  /** Default value for the property */
  default_value?: TExtraPropertyValue;
  /** Display text for true value (checkbox type) */
  true_value?: string;
  /** Display text for false value (checkbox type) */
  false_value?: string;
  /** Audit fields */
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

/**
 * Lightweight version of TExtraPropertyConfig for lists.
 */
export type TExtraPropertyConfigLite = Pick<
  TExtraPropertyConfig,
  "id" | "key" | "label" | "type" | "required" | "sort_order"
>;

/**
 * Value types that can be stored for extra properties.
 */
export type TExtraPropertyValue = string | string[] | boolean | null;

/**
 * Map of property keys to their values, stored on issues.
 */
export type TIssueExtraProperties = Record<string, TExtraPropertyValue>;

/**
 * Payload for creating/updating an extra property config.
 */
export type TExtraPropertyConfigPayload = Partial<
  Omit<
    TExtraPropertyConfig,
    "id" | "issue_type" | "workspace" | "created_at" | "updated_at" | "created_by" | "updated_by"
  >
>;

/**
 * Extra Property Types
 *
 * Types for configuring and storing additional properties on work items
 * based on their issue type configuration.
 */

/**
 * Supported input control types for extra properties.
 */
export type TExtraPropertyType = "text" | "textarea" | "select" | "multiselect" | "checkbox";

/**
 * Extra input configuration for an option or checkbox state.
 */
export interface TExtraInput {
  /** ID of the referenced ExtraPropertyConfig */
  config: string;
  /** Whether the condition property is required when visible */
  required?: boolean;
}

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
  /** Extra input config triggered when this option is selected */
  extra_input?: TExtraInput | null;
}

/**
 * Configuration for an extra property at workspace level.
 */
export interface TExtraPropertyConfig {
  /** Unique identifier */
  id: string;
  /** ID of the workspace */
  workspace: string;
  /** Unique key identifier within the workspace (alphanumeric with underscores) */
  key: string;
  /** Display label for the property */
  label: string;
  /** Type of input control */
  type: TExtraPropertyType;
  /** Optional description/help text */
  description?: string;
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
  /** Extra input config triggered when checkbox is true */
  true_extra_input?: TExtraInput | null;
  /** Extra input config triggered when checkbox is false */
  false_extra_input?: TExtraInput | null;
  /** Audit fields */
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

/**
 * Lightweight version of TExtraPropertyConfig for lists.
 */
export type TExtraPropertyConfigLite = Pick<TExtraPropertyConfig, "id" | "key" | "label" | "type" | "sort_order">;

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
  Omit<TExtraPropertyConfig, "id" | "workspace" | "created_at" | "updated_at" | "created_by" | "updated_by">
>;

/**
 * Binding between an IssueType and an ExtraPropertyConfig at project level.
 */
export interface TIssueTypeExtraProperty {
  /** Unique identifier */
  id: string;
  /** ID of the project */
  project: string;
  /** ID of the issue type */
  issue_type: string;
  /** ID of the extra property config */
  extra_property_config: string;
  /** Nested extra property config detail */
  extra_property_config_detail?: TExtraPropertyConfig;
  /** Sort order for display within the issue type */
  sort_order: number;
  /** Whether this property is required for issues of this type */
  is_required: boolean;
  /** ID of the parent ExtraPropertyConfig that triggers this condition binding; null for normal bindings */
  condition_config: string | null;
  /** Audit fields */
  created_at?: string;
  updated_at?: string;
}

/**
 * Payload for creating an issue type extra property binding.
 */
export type TIssueTypeExtraPropertyPayload = {
  extra_property_config: string;
  sort_order?: number;
  is_required?: boolean;
};

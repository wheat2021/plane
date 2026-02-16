// plane imports
import type { TFilterProperty, TSupportedOperators, TProjectIssueType } from "@plane/types";
import { EQUALITY_OPERATOR, COLLECTION_OPERATOR } from "@plane/types";
// local imports
import type { TCreateFilterConfigParams, IFilterIconConfig, TCreateFilterConfig } from "../../../rich-filters";
import { createFilterConfig, getMultiSelectConfig, createOperatorConfigEntry } from "../../../rich-filters";

/**
 * Issue type filter specific params
 */
export type TCreateIssueTypeFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<TProjectIssueType> & {
    issueTypes: TProjectIssueType[];
  };

/**
 * Helper to get the issue type multi select config
 * @param params - The filter params
 * @returns The issue type multi select config
 */
export const getIssueTypeMultiSelectConfig = (
  params: TCreateIssueTypeFilterParams,
  singleValueOperator: TSupportedOperators
) =>
  getMultiSelectConfig<TProjectIssueType, string, TProjectIssueType>(
    {
      items: params.issueTypes,
      getId: (issueType) => issueType.issue_type,
      getLabel: (issueType) => issueType.issue_type_detail.name,
      getValue: (issueType) => issueType.issue_type,
      getIconData: (issueType) => issueType,
    },
    {
      singleValueOperator,
      ...params,
    },
    {
      getOptionIcon: params.getOptionIcon,
    }
  );

/**
 * Get the issue type filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the issue type filter config
 */
export const getIssueTypeFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateIssueTypeFilterParams> =>
  (params: TCreateIssueTypeFilterParams) =>
    createFilterConfig<P>({
      id: key,
      label: "Issue Type",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getIssueTypeMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
      ]),
    });

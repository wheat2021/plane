// plane imports
import type { IUserLite, TExtraPropertyOption, TFilterProperty, TSupportedOperators } from "@plane/types";
import { EQUALITY_OPERATOR, COLLECTION_OPERATOR } from "@plane/types";
// local imports
import type { TCreateFilterConfigParams, IFilterIconConfig, TCreateFilterConfig } from "../../../rich-filters";
import {
  createFilterConfig,
  getMultiSelectConfig,
  createOperatorConfigEntry,
  getMemberMultiSelectConfig,
} from "../../../rich-filters";

/**
 * Extra property option filter specific params
 */
export type TCreateExtraPropertyOptionFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<string> & {
    label: string;
    options: TExtraPropertyOption[];
  };

/**
 * Helper to get the extra property option multi select config
 */
export const getExtraPropertyOptionMultiSelectConfig = (
  params: TCreateExtraPropertyOptionFilterParams,
  singleValueOperator: TSupportedOperators
) =>
  getMultiSelectConfig<TExtraPropertyOption, string, string>(
    {
      items: params.options,
      getId: (option) => option.value,
      getLabel: (option) => option.label ?? option.value,
      getValue: (option) => option.value,
      getIconData: (option) => option.value,
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
 * Get the extra property option filter config
 * @template K - The filter key
 * @param key - The filter key to use (format: extra_property_<configId>)
 * @returns A function that takes parameters and returns the extra property filter config
 */
export const getExtraPropertyOptionFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateExtraPropertyOptionFilterParams> =>
  (params: TCreateExtraPropertyOptionFilterParams) =>
    createFilterConfig<P>({
      ...params,
      id: key,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getExtraPropertyOptionMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
      ]),
    });

/**
 * Extra property member filter specific params
 */
export type TCreateExtraPropertyMemberFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<IUserLite> & {
    label: string;
    members: IUserLite[];
  };

/**
 * Get the extra property member filter config
 * @template K - The filter key
 * @param key - The filter key to use (format: extra_property_<configId>)
 * @returns A function that takes parameters and returns the extra property member filter config
 */
export const getExtraPropertyMemberFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateExtraPropertyMemberFilterParams> =>
  (params: TCreateExtraPropertyMemberFilterParams) =>
    createFilterConfig<P>({
      ...params,
      id: key,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getMemberMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
      ]),
    });

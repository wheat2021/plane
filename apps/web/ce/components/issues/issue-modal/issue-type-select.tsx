import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import { usePopper } from "react-popper";
import { Combobox } from "@headlessui/react";
import { Check } from "lucide-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { SearchIcon, ChevronDownIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssue, TBulkIssueProperties } from "@plane/types";
import { ComboDropDown } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useDropdown } from "@/hooks/use-dropdown";
import { useIssueType } from "@/hooks/store/use-issue-type";
import { usePlatformOS } from "@/hooks/use-platform-os";
// components
import { getIssueTypeIconFromProps } from "@/components/dropdowns/issue-type-icon";

export type TIssueFields = TIssue & TBulkIssueProperties;

export type TIssueTypeDropdownVariant = "xs" | "sm";

export type TIssueTypeSelectProps<T extends Partial<TIssueFields>> = {
  control: Control<T>;
  projectId: string | null;
  editorRef?: React.MutableRefObject<EditorRefApi | null>;
  disabled?: boolean;
  variant?: TIssueTypeDropdownVariant;
  placeholder?: string;
  isRequired?: boolean;
  renderChevron?: boolean;
  dropDownContainerClassName?: string;
  showMandatoryFieldInfo?: boolean;
  handleFormChange?: () => void;
};

type TIssueTypeOption = {
  id: string;
  name: string;
  icon: ReactNode;
};

export const IssueTypeSelect = observer(function IssueTypeSelect<T extends Partial<TIssueFields>>(
  props: TIssueTypeSelectProps<T>
) {
  const {
    control,
    projectId,
    disabled = false,
    placeholder = "Type",
    renderChevron = false,
    dropDownContainerClassName,
    handleFormChange,
  } = props;

  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // states
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // hooks
  const { t } = useTranslation();
  const { isMobile } = usePlatformOS();
  const { workspaceSlug } = useParams();
  // store hooks
  const { projectFetchedMap, fetchProjectIssueTypes, getProjectIssueTypes, getIssueTypeById } = useIssueType();

  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  // Fetch project issue types when projectId changes
  useEffect(() => {
    if (workspaceSlug && projectId && !projectFetchedMap[projectId]) {
      void fetchProjectIssueTypes(workspaceSlug.toString(), projectId);
    }
  }, [workspaceSlug, projectId, projectFetchedMap, fetchProjectIssueTypes]);

  // Get issue types enabled for the project
  const projectIssueTypes = projectId ? getProjectIssueTypes(projectId) : [];

  // Build options from project issue types
  const options: TIssueTypeOption[] =
    projectIssueTypes
      ?.map((pit) => {
        const detail = pit.issue_type_detail;
        return {
          id: pit.issue_type ?? detail?.id ?? "",
          name: detail?.name ?? "",
          icon: getIssueTypeIconFromProps(detail?.logo_props),
        };
      })
      .filter((o) => o.id && o.name) ?? [];

  const filteredOptions =
    query === "" ? options : options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()));

  const { handleClose, handleKeyDown, handleOnClick, searchInputKeyDown } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    onClose: undefined,
    query,
    setIsOpen,
    setQuery,
  });

  // Don't render if no project is selected or no issue types available
  if (!projectId || options.length === 0) {
    return null;
  }

  return (
    <Controller
      control={control}
      /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
      name={"type_id" as any}
      render={({ field: { value, onChange } }) => {
        /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
        const selectedIssueType = value ? getIssueTypeById(value as string) : null;
        const displayName = selectedIssueType?.name ?? placeholder;
        const displayIcon = selectedIssueType ? getIssueTypeIconFromProps(selectedIssueType.logo_props) : null;

        const dropdownOnChange = (val: string) => {
          onChange(val);
          handleClose();
          handleFormChange?.();
        };

        const comboButton = (
          <button
            ref={setReferenceElement}
            type="button"
            className={cn("clickable block h-full max-w-full outline-none", {
              "cursor-not-allowed text-secondary": disabled,
              "cursor-pointer": !disabled,
            })}
            onClick={handleOnClick}
            disabled={disabled}
          >
            <Tooltip
              tooltipHeading={t("work_item_type")}
              tooltipContent={displayName}
              disabled={false}
              isMobile={isMobile}
            >
              <div
                className={cn(
                  "h-full flex items-center gap-1.5 border-[0.5px] rounded-sm px-2 py-0.5 bg-layer-2 border-strong",
                  dropDownContainerClassName
                )}
              >
                {displayIcon && <span className="grid place-items-center flex-shrink-0 h-4 w-4">{displayIcon}</span>}
                <span
                  className={cn("flex-grow truncate text-body-xs-medium", {
                    "text-secondary": selectedIssueType,
                    "text-placeholder": !selectedIssueType,
                  })}
                >
                  {displayName}
                </span>
                {renderChevron && <ChevronDownIcon className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />}
              </div>
            </Tooltip>
          </button>
        );

        return (
          <ComboDropDown
            as="div"
            ref={dropdownRef}
            className={cn("h-full", {
              "bg-layer-1": isOpen,
            })}
            value={value}
            onChange={dropdownOnChange}
            disabled={disabled}
            onKeyDown={handleKeyDown}
            button={comboButton}
            renderByDefault
          >
            {isOpen && (
              <Combobox.Options className="fixed z-10" static>
                <div
                  className="my-1 w-48 rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200 focus:outline-none"
                  ref={setPopperElement}
                  style={styles.popper}
                  {...attributes.popper}
                >
                  <div className="flex items-center gap-1.5 rounded-sm border border-subtle bg-surface-2 px-2">
                    <SearchIcon className="h-3.5 w-3.5 text-placeholder" strokeWidth={1.5} />
                    <Combobox.Input
                      as="input"
                      ref={inputRef}
                      className="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t("search")}
                      displayValue={(assigned: TIssueTypeOption | null) => assigned?.name ?? ""}
                      onKeyDown={searchInputKeyDown}
                    />
                  </div>
                  <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
                    {filteredOptions.length > 0 ? (
                      filteredOptions.map((option) => (
                        <Combobox.Option
                          key={option.id}
                          value={option.id}
                          className={({ active, selected }) =>
                            cn(
                              `w-full truncate flex items-center justify-between gap-2 rounded-sm px-1 py-1.5 cursor-pointer select-none ${
                                active ? "bg-layer-transparent-hover" : ""
                              } ${selected ? "text-primary" : "text-secondary"}`
                            )
                          }
                        >
                          {({ selected }) => (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="grid place-items-center flex-shrink-0 h-4 w-4">{option.icon}</span>
                                <span className="flex-grow truncate">{option.name}</span>
                              </div>
                              {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                            </>
                          )}
                        </Combobox.Option>
                      ))
                    ) : (
                      <p className="text-placeholder italic py-1 px-1.5">{t("no_matching_results")}</p>
                    )}
                  </div>
                </div>
              </Combobox.Options>
            )}
          </ComboDropDown>
        );
      }}
    />
  );
});

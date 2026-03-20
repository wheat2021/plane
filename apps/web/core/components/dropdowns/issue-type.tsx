import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Combobox } from "@headlessui/react";
import { Layers } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { ComboDropDown } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useDropdown } from "@/hooks/use-dropdown";
import { getIssueTypeIconFromProps } from "./issue-type-icon";
import { useIssueType } from "@/hooks/store/use-issue-type";
import { usePlatformOS } from "@/hooks/use-platform-os";
// constants
import { BACKGROUND_BUTTON_VARIANTS, BORDER_BUTTON_VARIANTS, BUTTON_VARIANTS_WITHOUT_TEXT } from "./constants";
// types
import type { TDropdownProps } from "./types";

type Props = TDropdownProps & {
  button?: ReactNode;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  onChange: (val: string | null) => void;
  onClose?: () => void;
  projectId?: string;
  value: string | null | undefined;
  workspaceSlug: string;
  renderByDefault?: boolean;
};

type ButtonProps = {
  className?: string;
  dropdownArrow: boolean;
  dropdownArrowClassName: string;
  hideIcon?: boolean;
  hideText?: boolean;
  isActive?: boolean;
  placeholder: string;
  issueTypeName: string | undefined;
  issueTypeIcon: ReactNode | null;
  showTooltip: boolean;
  renderToolTipByDefault?: boolean;
};

function BorderButton(props: ButtonProps) {
  const {
    className,
    dropdownArrow,
    dropdownArrowClassName,
    hideIcon = false,
    hideText = false,
    placeholder,
    issueTypeName,
    issueTypeIcon,
    showTooltip,
    renderToolTipByDefault = true,
  } = props;

  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();

  return (
    <Tooltip
      tooltipHeading={t("work_item_type")}
      tooltipContent={issueTypeName ?? t("common.none")}
      disabled={!showTooltip}
      isMobile={isMobile}
      renderByDefault={renderToolTipByDefault}
    >
      <div
        className={cn(
          "h-full flex items-center gap-1.5 border-[0.5px] rounded-sm px-2 py-0.5 bg-layer-2 border-strong",
          {
            "px-0.5": hideText,
          },
          className
        )}
      >
        {!hideIcon && (
          <span className="grid place-items-center flex-shrink-0">
            {issueTypeIcon ?? <Layers size={14} className="text-placeholder" />}
          </span>
        )}
        {!hideText && (
          <span
            className={cn("flex-grow truncate text-body-xs-medium", {
              "text-secondary": issueTypeName,
              "text-placeholder": !issueTypeName,
            })}
          >
            {issueTypeName ?? placeholder}
          </span>
        )}
        {dropdownArrow && (
          <ChevronDownIcon className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </div>
    </Tooltip>
  );
}

function BackgroundButton(props: ButtonProps) {
  const {
    className,
    dropdownArrow,
    dropdownArrowClassName,
    hideIcon = false,
    hideText = false,
    placeholder,
    issueTypeName,
    issueTypeIcon,
    showTooltip,
    renderToolTipByDefault = true,
  } = props;

  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();

  return (
    <Tooltip
      tooltipHeading={t("work_item_type")}
      tooltipContent={issueTypeName ?? t("common.none")}
      disabled={!showTooltip}
      isMobile={isMobile}
      renderByDefault={renderToolTipByDefault}
    >
      <div
        className={cn(
          "h-full flex items-center gap-1.5 rounded-sm px-2 py-0.5 bg-layer-2",
          {
            "px-0.5": hideText,
          },
          className
        )}
      >
        {!hideIcon && (
          <span className="grid place-items-center flex-shrink-0">
            {issueTypeIcon ?? <Layers size={14} className="text-placeholder" />}
          </span>
        )}
        {!hideText && (
          <span
            className={cn("flex-grow truncate text-body-xs-medium", {
              "text-secondary": issueTypeName,
              "text-placeholder": !issueTypeName,
            })}
          >
            {issueTypeName ?? placeholder}
          </span>
        )}
        {dropdownArrow && (
          <ChevronDownIcon className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </div>
    </Tooltip>
  );
}

function TransparentButton(props: ButtonProps) {
  const {
    className,
    dropdownArrow,
    dropdownArrowClassName,
    hideIcon = false,
    hideText = false,
    isActive = false,
    placeholder,
    issueTypeName,
    issueTypeIcon,
    showTooltip,
    renderToolTipByDefault = true,
  } = props;

  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();

  return (
    <Tooltip
      tooltipHeading={t("work_item_type")}
      tooltipContent={issueTypeName ?? t("common.none")}
      disabled={!showTooltip}
      isMobile={isMobile}
      renderByDefault={renderToolTipByDefault}
    >
      <div
        className={cn(
          "h-full w-full flex items-center gap-1.5 rounded-sm hover:bg-layer-transparent-hover px-2",
          {
            "px-0.5": hideText,
            "bg-layer-1": isActive,
          },
          className
        )}
      >
        {!hideIcon && (
          <span className="grid place-items-center flex-shrink-0">
            {issueTypeIcon ?? <Layers size={14} className="text-placeholder" />}
          </span>
        )}
        {!hideText && (
          <span
            className={cn("flex-grow truncate text-body-xs-medium", {
              "text-secondary": issueTypeName,
              "text-placeholder": !issueTypeName,
            })}
          >
            {issueTypeName ?? placeholder}
          </span>
        )}
        {dropdownArrow && (
          <ChevronDownIcon className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </div>
    </Tooltip>
  );
}

export const IssueTypeDropdown = observer(function IssueTypeDropdown(props: Props) {
  const { t } = useTranslation();
  const {
    button,
    buttonClassName,
    buttonContainerClassName,
    buttonVariant,
    className = "",
    disabled = false,
    dropdownArrow = false,
    dropdownArrowClassName = "",
    hideIcon = false,
    onChange,
    onClose,
    placeholder = t("work_item_type"),
    placement,
    projectId,
    showTooltip = false,
    tabIndex,
    value,
    workspaceSlug,
    renderByDefault = true,
  } = props;

  // states
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  // store hooks
  const {
    fetchedMap,
    projectFetchedMap,
    fetchWorkspaceIssueTypes,
    fetchProjectIssueTypes,
    getWorkspaceIssueTypes,
    getProjectIssueTypes,
    getIssueTypeById,
  } = useIssueType();

  // Fetch issue types when workspace/project changes
  useEffect(() => {
    if (projectId && workspaceSlug && !projectFetchedMap[projectId]) {
      void fetchProjectIssueTypes(workspaceSlug, projectId);
    } else if (workspaceSlug && !projectId && !fetchedMap[workspaceSlug]) {
      void fetchWorkspaceIssueTypes(workspaceSlug);
    }
  }, [workspaceSlug, projectId, fetchedMap, projectFetchedMap, fetchWorkspaceIssueTypes, fetchProjectIssueTypes]);

  // Build options: use project types when projectId is given, otherwise workspace types
  const options = (() => {
    if (projectId) {
      const projectIssueTypes = getProjectIssueTypes(projectId);
      return (
        projectIssueTypes
          ?.map((pit) => {
            const detail = pit.issue_type_detail;
            return {
              id: pit.issue_type ?? detail?.id ?? "",
              name: detail?.name ?? "",
              icon: getIssueTypeIconFromProps(detail?.logo_props),
            };
          })
          .filter((o) => o.id && o.name) ?? []
      );
    }
    const issueTypes = workspaceSlug ? getWorkspaceIssueTypes(workspaceSlug) : [];
    return (
      issueTypes?.map((issueType) => ({
        id: issueType.id,
        name: issueType.name,
        icon: getIssueTypeIconFromProps(issueType.logo_props),
      })) ?? []
    );
  })();

  const filteredOptions =
    query === "" ? options : options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()));

  // Get selected issue type details
  const selectedIssueType = value ? getIssueTypeById(value) : null;
  const displayName = selectedIssueType?.name;
  const displayIcon = selectedIssueType ? getIssueTypeIconFromProps(selectedIssueType.logo_props) : null;

  const dropdownOnChange = (val: string | null) => {
    onChange(val);
    handleClose();
  };

  const { handleClose, handleKeyDown, handleOnClick, searchInputKeyDown } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    onClose,
    query,
    setIsOpen,
    setQuery,
  });

  const ButtonToRender = BORDER_BUTTON_VARIANTS.includes(buttonVariant)
    ? BorderButton
    : BACKGROUND_BUTTON_VARIANTS.includes(buttonVariant)
      ? BackgroundButton
      : TransparentButton;

  const comboButton = (
    <>
      {button ? (
        <button
          ref={setReferenceElement}
          type="button"
          className={cn("clickable block h-full w-full outline-none", buttonContainerClassName)}
          onClick={handleOnClick}
          disabled={disabled}
          tabIndex={tabIndex}
        >
          {button}
        </button>
      ) : (
        <button
          ref={setReferenceElement}
          type="button"
          className={cn(
            "clickable block h-full max-w-full outline-none",
            {
              "cursor-not-allowed text-secondary": disabled,
              "cursor-pointer": !disabled,
            },
            buttonContainerClassName
          )}
          onClick={handleOnClick}
          disabled={disabled}
          tabIndex={tabIndex}
        >
          <ButtonToRender
            issueTypeName={displayName}
            issueTypeIcon={displayIcon}
            className={buttonClassName}
            dropdownArrow={dropdownArrow && !disabled}
            dropdownArrowClassName={dropdownArrowClassName}
            hideIcon={hideIcon}
            placeholder={placeholder}
            showTooltip={showTooltip}
            hideText={BUTTON_VARIANTS_WITHOUT_TEXT.includes(buttonVariant)}
            renderToolTipByDefault={renderByDefault}
          />
        </button>
      )}
    </>
  );

  // Don't render if no issue types available
  if (options.length === 0) {
    return null;
  }

  return (
    <ComboDropDown
      as="div"
      ref={dropdownRef}
      className={cn(
        "h-full",
        {
          "bg-layer-1": isOpen,
        },
        className
      )}
      value={value}
      onChange={dropdownOnChange}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      button={comboButton}
      renderByDefault={renderByDefault}
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
                displayValue={(val: string | null) => {
                  const type = val ? getIssueTypeById(val) : null;
                  return type?.name ?? "";
                }}
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
                        {selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
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
});

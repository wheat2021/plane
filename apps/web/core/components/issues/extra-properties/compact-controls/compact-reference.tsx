import { useState, Fragment } from "react";
import type { FC } from "react";
import { ExternalLink, Link2 } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
import { usePopper } from "react-popper";
import { Tooltip } from "@plane/propel/tooltip";
import type { TExtraPropertyConfig, TExtraPropertyValue, TReferenceItem } from "@plane/types";
import { cn } from "@plane/utils";
import { usePlatformOS } from "@/hooks/use-platform-os";

interface ICompactReferenceControl {
  config: TExtraPropertyConfig;
  value: TExtraPropertyValue;
  disabled?: boolean;
}

function parseLinks(value: TExtraPropertyValue): TReferenceItem[] {
  if (!value || !Array.isArray(value) || value.length === 0) return [];
  if (typeof value[0] === "object" && value[0] !== null) return value as TReferenceItem[];
  return [];
}

export const CompactReferenceControl: FC<ICompactReferenceControl> = (props) => {
  const { config, value } = props;
  const { isMobile } = usePlatformOS();
  const links = parseLinks(value);
  const hasLinks = links.length > 0;

  const [referenceEl, setReferenceEl] = useState<HTMLButtonElement | null>(null);
  const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceEl, popperEl, {
    placement: "bottom-start",
    modifiers: [{ name: "offset", options: { offset: [0, 4] } }],
  });

  const tooltipContent = hasLinks ? links.map((l) => l.display).join(", ") : "暂无链接";

  const iconButton = (
    <div
      className={cn(
        "flex h-5 flex-shrink-0 items-center justify-center rounded-sm border-[0.5px] border-strong px-1.5 py-0.5",
        "transition-colors",
        hasLinks ? "hover:bg-layer-1" : "cursor-default opacity-60"
      )}
    >
      <Link2 className={cn("h-3 w-3 flex-shrink-0", hasLinks ? "text-blue-500" : "text-secondary")} />
    </div>
  );

  if (!hasLinks) {
    return (
      <Tooltip tooltipHeading={config.label} tooltipContent={tooltipContent} isMobile={isMobile}>
        <div className="h-5">{iconButton}</div>
      </Tooltip>
    );
  }

  return (
    <Popover className="relative h-5">
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        className="h-5"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <Tooltip tooltipHeading={config.label} tooltipContent={tooltipContent} isMobile={isMobile}>
          <Popover.Button
            ref={setReferenceEl}
            className="h-5 p-0 border-0 bg-transparent hover:bg-transparent focus:outline-none"
          >
            {iconButton}
          </Popover.Button>
        </Tooltip>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel
          ref={setPopperEl}
          style={styles.popper}
          {...attributes.popper}
          className="z-30 min-w-48 max-w-64 rounded-md border border-strong bg-layer-2 shadow-lg py-1"
        >
          {links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-layer-1 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-body-xs-regular text-primary truncate flex-1">{link.display}</span>
              <ExternalLink className="h-3 w-3 flex-shrink-0 text-secondary" />
            </a>
          ))}
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};

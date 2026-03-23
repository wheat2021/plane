import type { FC } from "react";
import { observer } from "mobx-react";
import { UserX, User } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import type { TExtraPropertyConfig, TExtraPropertyValue } from "@plane/types";
import { Avatar } from "@plane/ui";
import { cn } from "@plane/utils";
import { useMember } from "@/hooks/store/use-member";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";

interface ICompactMemberControl {
  config: TExtraPropertyConfig;
  value: TExtraPropertyValue;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export const CompactMemberControl: FC<ICompactMemberControl> = observer((props) => {
  const { config, value, onChange, disabled = false } = props;
  const { isMobile } = usePlatformOS();
  const { getUserDetails } = useMember();

  const userId = typeof value === "string" && value ? value : null;
  const userDetails = userId ? getUserDetails(userId) : undefined;
  const memberColor = config.member_color;

  const displayName = userDetails?.display_name ?? (userId ? "已移除用户" : "—");

  const pillContent = userId ? (
    userDetails ? (
      <div className="flex h-5 flex-shrink-0 items-center gap-1 overflow-hidden rounded-sm border-[0.5px] border-strong px-1.5 py-0.5">
        <div
          className="rounded-full flex-shrink-0"
          style={memberColor ? { padding: 1, background: memberColor } : undefined}
        >
          <Avatar name={userDetails.display_name} src={userDetails.avatar_url ?? undefined} size="xs" />
        </div>
        <span className="text-caption-sm-regular truncate max-w-16">{userDetails.display_name}</span>
      </div>
    ) : (
      <div className="flex h-5 flex-shrink-0 items-center gap-1 overflow-hidden rounded-sm border-[0.5px] border-strong px-1.5 py-0.5">
        <UserX className="h-3 w-3 flex-shrink-0 text-secondary" />
        <span className="text-caption-sm-regular truncate max-w-16 text-tertiary">已移除用户</span>
      </div>
    )
  ) : (
    <div
      className={cn(
        "flex h-5 flex-shrink-0 items-center justify-center rounded-sm border-[0.5px] border-strong px-2 py-0.5",
        "hover:bg-layer-1 transition-colors",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <User className="h-3 w-3 flex-shrink-0 text-secondary" />
    </div>
  );

  if (disabled) {
    return (
      <Tooltip tooltipHeading={config.label} tooltipContent={displayName} isMobile={isMobile}>
        <div className="h-5">{pillContent}</div>
      </Tooltip>
    );
  }

  return (
    <Tooltip tooltipHeading={config.label} tooltipContent={displayName} isMobile={isMobile}>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        className="h-5"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <MemberDropdown
          multiple={false}
          value={userId}
          onChange={(val: string | null) => onChange(val)}
          buttonVariant="transparent-without-text"
          buttonContainerClassName="h-5"
          buttonClassName="h-5 p-0 border-0 bg-transparent hover:bg-transparent"
          button={pillContent}
        />
      </div>
    </Tooltip>
  );
});

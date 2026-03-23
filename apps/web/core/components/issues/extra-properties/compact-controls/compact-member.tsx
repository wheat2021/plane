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

  // Avatar wrapped in a colored circle (h-5 w-5 container, sm avatar inside)
  // memberColor becomes the full background when set, giving clear visual distinction
  const avatarIcon = userId ? (
    userDetails ? (
      <div
        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
        style={memberColor ? { backgroundColor: memberColor } : undefined}
      >
        <Avatar
          name={userDetails.display_name}
          src={userDetails.avatar_url ?? undefined}
          size="sm"
          showTooltip={false}
          fallbackBackgroundColor={memberColor ?? undefined}
        />
      </div>
    ) : (
      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-layer-2">
        <UserX className="h-3 w-3 flex-shrink-0 text-secondary" />
      </div>
    )
  ) : (
    <div
      className={cn(
        "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full",
        "border border-dashed border-custom-border-300",
        "hover:border-custom-border-400 transition-colors",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <User className="h-3 w-3 flex-shrink-0 text-custom-text-300" />
    </div>
  );

  if (disabled) {
    return (
      <Tooltip tooltipHeading={config.label} tooltipContent={displayName} isMobile={isMobile}>
        <div className="flex h-5 items-center">{avatarIcon}</div>
      </Tooltip>
    );
  }

  return (
    <Tooltip tooltipHeading={config.label} tooltipContent={displayName} isMobile={isMobile}>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        className="flex h-5 items-center"
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
          button={avatarIcon}
        />
      </div>
    </Tooltip>
  );
});

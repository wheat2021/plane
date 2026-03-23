import type { FC } from "react";
import { observer } from "mobx-react";
import { UserX } from "lucide-react";
import type { TExtraPropertyConfig, TExtraPropertyValue } from "@plane/types";
import { Avatar } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";

interface IMemberControl {
  config: TExtraPropertyConfig;
  value: TExtraPropertyValue;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  workspaceSlug?: string;
}

export const MemberControl: FC<IMemberControl> = observer((props) => {
  const { config, value, onChange, disabled = false } = props;

  const { getUserDetails } = useMember();

  const userId = typeof value === "string" && value ? value : null;
  const userDetails = userId ? getUserDetails(userId) : undefined;
  const memberColor = config.member_color;

  // Avatar with optional colored background (full circle, not just a ring)
  const avatarEl = userDetails ? (
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
  ) : null;

  // Disabled / read-only display
  if (disabled) {
    if (!userId) {
      return <span className="text-body-xs-regular text-placeholder h-7.5 flex items-center">—</span>;
    }
    if (!userDetails) {
      return (
        <span className="text-body-xs-regular text-tertiary h-7.5 flex items-center gap-1.5">
          <UserX className="h-3.5 w-3.5 shrink-0" />
          已移除用户
        </span>
      );
    }
    return (
      <div className="flex items-center gap-1.5 h-7.5">
        {avatarEl}
        <span className="text-body-xs-regular truncate">{userDetails.display_name}</span>
      </div>
    );
  }

  return (
    <MemberDropdown
      multiple={false}
      value={userId}
      onChange={(val: string | null) => onChange(val)}
      buttonVariant="transparent-without-text"
      buttonContainerClassName="w-full text-left h-7.5"
      buttonClassName={cn("w-full", !userId && "text-placeholder")}
      showUserDetails={false}
      placeholder="选择成员..."
      button={
        userId && userDetails ? (
          <div className="flex items-center gap-1.5">
            {avatarEl}
            <span className="text-body-xs-regular truncate">{userDetails.display_name}</span>
          </div>
        ) : userId && !userDetails ? (
          <span className="text-body-xs-regular text-tertiary flex items-center gap-1.5">
            <UserX className="h-3.5 w-3.5 shrink-0" />
            已移除用户
          </span>
        ) : undefined
      }
    />
  );
});

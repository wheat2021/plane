import { observer } from "mobx-react";
// plane imports
import { PlaneLockup } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import { useUser } from "@/hooks/store/user";
// local imports
import { SwitchAccountDropdown } from "./switch-account-dropdown";

// 内部部署：只有 Profile Setup 一步，进度条始终显示满格
export const OnboardingHeader = observer(function OnboardingHeader() {
  // store hooks
  const { data: user } = useUser();

  const userName = user?.display_name
    ? user?.display_name
    : user?.first_name
      ? `${user?.first_name} ${user?.last_name ?? ""}`
      : user?.email;

  return (
    <div className="flex flex-col gap-4 sticky top-0 z-10">
      <div className="h-1.5 rounded-t-lg w-full bg-surface-1 overflow-hidden cursor-pointer">
        <Tooltip tooltipContent="1/1" position="bottom-end">
          <div className="h-full bg-accent-primary transition-all duration-700 ease-out" style={{ width: "100%" }} />
        </Tooltip>
      </div>
      <div className="flex items-center justify-between gap-6 w-full px-6">
        <PlaneLockup height={20} width={95} className="text-primary" />
        <SwitchAccountDropdown fullName={userName} />
      </div>
    </div>
  );
});

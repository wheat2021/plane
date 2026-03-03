import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspaceMemberInvitation, TOnboardingStep } from "@plane/types";
import { EOnboardingSteps } from "@plane/types";
// hooks
import { useUser, useUserProfile } from "@/hooks/store/user";
// local components
import { OnboardingHeader } from "./header";
import { OnboardingStepRoot } from "./steps";

type Props = {
  invitations?: IWorkspaceMemberInvitation[];
};

export const OnboardingRoot = observer(function OnboardingRoot({ invitations = [] }: Props) {
  const currentStep: TOnboardingStep = EOnboardingSteps.PROFILE_SETUP;
  // store hooks
  const { data: user } = useUser();
  const { finishUserOnboarding } = useUserProfile();

  // complete onboarding
  const finishOnboarding = useCallback(async () => {
    if (!user) return;
    try {
      await finishUserOnboarding();
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Failed",
        message: "Failed to finish onboarding, Please try again later.",
      });
    }
  }, [user, finishUserOnboarding]);

  // 内部部署：Profile Setup 完成后直接结束引导，跳过 Role/UseCase/Workspace/Invite 步骤
  const handleStepChange = useCallback(
    (step: EOnboardingSteps) => {
      if (step === EOnboardingSteps.PROFILE_SETUP) {
        void finishOnboarding();
      }
    },
    [finishOnboarding]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header with progress */}
      <OnboardingHeader />

      {/* Main content area */}
      <OnboardingStepRoot currentStep={currentStep} invitations={invitations} handleStepChange={handleStepChange} />
    </div>
  );
});

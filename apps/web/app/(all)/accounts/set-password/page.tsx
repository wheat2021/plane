"use client";

// plane imports
import { useSearchParams } from "next/navigation";
// components
import { ResetPasswordForm } from "@/components/account/auth-forms/reset-password";
import { SetPasswordForm } from "@/components/account/auth-forms/set-password";
import { AuthHeaderBase } from "@/components/auth-screens/header";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
// layouts
import DefaultLayout from "@/layouts/default-layout";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";

function SetPasswordPage() {
  const searchParams = useSearchParams();
  const uidb64 = searchParams.get("uidb64");
  const token = searchParams.get("token");
  // Use ResetPasswordForm only when an email-link token is present;
  // otherwise show SetPasswordForm for authenticated users (admin pre-created accounts).
  const isEmailLinkFlow = Boolean(uidb64 && token);

  return (
    <DefaultLayout>
      <AuthenticationWrapper pageType={EPageTypes.SET_PASSWORD}>
        <div className="relative z-10 flex flex-col items-center w-screen h-screen overflow-hidden overflow-y-auto pt-6 pb-10 px-8">
          <AuthHeaderBase pageTitle="设置密码" />
          {isEmailLinkFlow ? <ResetPasswordForm /> : <SetPasswordForm />}
        </div>
      </AuthenticationWrapper>
    </DefaultLayout>
  );
}

export default SetPasswordPage;

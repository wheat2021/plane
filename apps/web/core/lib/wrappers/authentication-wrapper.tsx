import type { ReactNode } from "react";
import { useEffect } from "react";
import { observer } from "mobx-react";
import { useSearchParams, usePathname } from "next/navigation";
import useSWR from "swr";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserProfile, useUserSettings } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

type TPageType = EPageTypes;

type TAuthenticationWrapper = {
  children: ReactNode;
  pageType?: TPageType;
};

const isValidURL = (url: string): boolean => {
  const disallowedSchemes = /^(https?|ftp):\/\//i;
  return !disallowedSchemes.test(url);
};

export const AuthenticationWrapper = observer(function AuthenticationWrapper(props: TAuthenticationWrapper) {
  const pathname = usePathname();
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next_path");
  // props
  const { children, pageType = EPageTypes.AUTHENTICATED } = props;
  // hooks
  const { isLoading: isUserLoading, data: currentUser, fetchCurrentUser } = useUser();
  const { data: currentUserProfile } = useUserProfile();
  const { data: currentUserSettings } = useUserSettings();
  const { loader: workspacesLoader, workspaces } = useWorkspace();

  const { isLoading: isUserSWRLoading } = useSWR("USER_INFORMATION", async () => await fetchCurrentUser(), {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const isUserOnboard =
    currentUserProfile?.is_onboarded ||
    (currentUserProfile?.onboarding_step?.profile_complete &&
      currentUserProfile?.onboarding_step?.workspace_create &&
      currentUserProfile?.onboarding_step?.workspace_invite &&
      currentUserProfile?.onboarding_step?.workspace_join) ||
    false;

  const getWorkspaceRedirectionUrl = (): string => {
    let redirectionRoute = "/create-workspace";

    // validating the nextPath from the router query
    if (nextPath && isValidURL(nextPath.toString())) {
      redirectionRoute = nextPath.toString();
      return redirectionRoute;
    }

    // validate the last and fallback workspace_slug
    const currentWorkspaceSlug =
      currentUserSettings?.workspace?.last_workspace_slug || currentUserSettings?.workspace?.fallback_workspace_slug;

    // validate the current workspace_slug is available in the user's workspace list
    const isCurrentWorkspaceValid = Object.values(workspaces || {}).findIndex(
      (workspace) => workspace.slug === currentWorkspaceSlug
    );

    if (isCurrentWorkspaceValid >= 0) redirectionRoute = `/${currentWorkspaceSlug}`;

    return redirectionRoute;
  };

  // Compute redirect target outside render (null = no redirect, render children)
  const getRedirectTarget = (): string | null => {
    const isLoading = (isUserSWRLoading || isUserLoading || workspacesLoader) && !currentUser?.id;
    if (isLoading) return null;

    if (pageType === EPageTypes.PUBLIC) return null;

    if (pageType === EPageTypes.NON_AUTHENTICATED) {
      if (!currentUser?.id) return null;
      if (currentUser?.is_password_autoset || currentUser?.is_password_reset_required) return "/accounts/set-password";
      if (currentUserProfile?.id && isUserOnboard) return getWorkspaceRedirectionUrl();
      return "/onboarding";
    }

    if (pageType === EPageTypes.ONBOARDING) {
      if (!currentUser?.id) return `/${pathname ? `?next_path=${pathname}` : ``}`;
      if (currentUser?.is_password_autoset || currentUser?.is_password_reset_required) return "/accounts/set-password";
      if (currentUser && currentUserProfile?.id && isUserOnboard) return getWorkspaceRedirectionUrl();
      return null;
    }

    if (pageType === EPageTypes.SET_PASSWORD) {
      if (!currentUser?.id) return `/${pathname ? `?next_path=${pathname}` : ``}`;
      // If user doesn't need to set password, redirect away regardless of onboarding status
      if (currentUser && !currentUser?.is_password_autoset && !currentUser?.is_password_reset_required) {
        if (currentUserProfile?.id && isUserOnboard) return getWorkspaceRedirectionUrl();
        if (currentUserProfile?.id) return "/onboarding";
        return null; // Profile still loading
      }
      return null;
    }

    if (pageType === EPageTypes.AUTHENTICATED) {
      if (!currentUser?.id) return `/${pathname ? `?next_path=${pathname}` : ``}`;
      if (currentUser?.is_password_autoset || currentUser?.is_password_reset_required) return "/accounts/set-password";
      if (currentUserProfile?.id && isUserOnboard) return null;
      return "/onboarding";
    }

    return null;
  };

  const redirectTarget = getRedirectTarget();

  // All navigation happens in useEffect to avoid setState-during-render warnings
  useEffect(() => {
    if (!redirectTarget) return;
    if (pageType === EPageTypes.ONBOARDING && currentUser?.id && currentUserProfile?.id && isUserOnboard) {
      router.replace(redirectTarget);
    } else {
      router.push(redirectTarget);
    }
  }, [redirectTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = (isUserSWRLoading || isUserLoading || workspacesLoader) && !currentUser?.id;
  if (isLoading)
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );

  if (redirectTarget) return <></>;

  return <>{children}</>;
});

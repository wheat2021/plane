import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ContentWrapper } from "@plane/ui";
// hooks
import { useHome } from "@/hooks/store/use-home";
import { useUser } from "@/hooks/store/user";
// plane web imports
import { HomePeekOverviewsRoot } from "@/plane-web/components/home";
// local imports
import { DashboardWidgets } from "./home-dashboard-widgets";
import { UserGreetingsView } from "./user-greetings";

export const WorkspaceHomeView = observer(function WorkspaceHomeView() {
  // store hooks
  const { workspaceSlug } = useParams();
  const { data: currentUser } = useUser();
  const { fetchWidgets } = useHome();

  useSWR(
    workspaceSlug ? `HOME_DASHBOARD_WIDGETS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWidgets(workspaceSlug?.toString()) : null,
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // TODO: refactor loader implementation
  return (
    <>
      <>
        <HomePeekOverviewsRoot />
        <ContentWrapper className="gap-6 bg-surface-1 mx-auto scrollbar-hide px-page-x">
          <div className="max-w-[800px] mx-auto w-full">
            {currentUser && <UserGreetingsView user={currentUser} />}
            <DashboardWidgets />
          </div>
        </ContentWrapper>
      </>
    </>
  );
});

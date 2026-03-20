"use client";

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { WorkItemTypeSettingsRoot } from "@/components/workspace/settings/work-item-types";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// local imports
import { WorkItemTypesSettingsHeader } from "./header";

const WorkItemTypesSettingsPage = observer(() => {
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const pageTitle = currentWorkspace?.name
    ? t("workspace_settings.settings.work_item_types.page_label", { workspace: currentWorkspace.name })
    : undefined;

  return (
    <SettingsContentWrapper header={<WorkItemTypesSettingsHeader />}>
      <PageHead title={pageTitle} />
      <WorkItemTypeSettingsRoot />
    </SettingsContentWrapper>
  );
});

export default WorkItemTypesSettingsPage;

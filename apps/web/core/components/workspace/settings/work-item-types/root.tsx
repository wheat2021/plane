"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button, Loader } from "@plane/ui";
// components
import { WorkItemTypeForm } from "./type-form";
import { WorkItemTypeList } from "./type-list";
// hooks
import { useIssueType } from "@/hooks/store/use-issue-type";

export const WorkItemTypeSettingsRoot = observer(function WorkItemTypeSettingsRoot() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { fetchedMap, fetchWorkspaceIssueTypes, getWorkspaceIssueTypes } = useIssueType();

  const [isFormOpen, setIsFormOpen] = useState(false);

  const isFetched = fetchedMap[workspaceSlug as string];
  const issueTypes = getWorkspaceIssueTypes(workspaceSlug as string) ?? [];

  useEffect(() => {
    if (workspaceSlug && !isFetched) {
      void fetchWorkspaceIssueTypes(workspaceSlug);
    }
  }, [workspaceSlug, isFetched, fetchWorkspaceIssueTypes]);

  if (!isFetched) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Loader className="flex flex-col gap-4">
          <Loader.Item height="60px" width="100%" />
          <Loader.Item height="60px" width="100%" />
          <Loader.Item height="60px" width="100%" />
        </Loader>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-between px-4">
        <div>
          <h3 className="text-lg font-medium">{t("workspace_settings.settings.work_item_types.title")}</h3>
          <p className="text-sm text-custom-text-200">{t("workspace_settings.settings.work_item_types.description")}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsFormOpen(true)}>
          <Plus className="size-4" />
          {t("workspace_settings.settings.work_item_types.add_type")}
        </Button>
      </div>

      <div className="flex flex-col gap-2 px-4">
        <WorkItemTypeList issueTypes={issueTypes} isFormOpen={isFormOpen} />

        {isFormOpen && <WorkItemTypeForm onClose={() => setIsFormOpen(false)} />}
      </div>
    </div>
  );
});

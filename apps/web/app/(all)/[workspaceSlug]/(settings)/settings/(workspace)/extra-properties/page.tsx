"use client";

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { ExtraPropertySettingsRoot } from "@/components/workspace/settings/extra-properties/root";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// local imports
import { ExtraPropertiesSettingsHeader } from "./header";

const ExtraPropertiesSettingsPage = observer(() => {
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();
  // derived values
  const pageTitle = currentWorkspace?.name
    ? t("workspace_settings.settings.extra_properties.page_label", { workspace: currentWorkspace.name })
    : undefined;

  return (
    <SettingsContentWrapper header={<ExtraPropertiesSettingsHeader />}>
      <PageHead title={pageTitle} />
      <ExtraPropertySettingsRoot />
    </SettingsContentWrapper>
  );
});

export default ExtraPropertiesSettingsPage;

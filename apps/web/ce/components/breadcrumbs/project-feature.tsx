import type { ReactNode } from "react";
import { observer } from "mobx-react";
// plane imports
import type { EProjectFeatureKey } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import type { TNavigationItem } from "@/components/workspace/sidebar/project-navigation";
// hooks
import { useProject } from "@/hooks/store/use-project";
// local imports
import { getProjectFeatureNavigation } from "../projects/navigation/helper";

type TProjectFeatureBreadcrumbProps = {
  workspaceSlug: string;
  projectId: string;
  featureKey: EProjectFeatureKey;
  isLast?: boolean;
  additionalNavigationItems?: TNavigationItem[];
};

export const ProjectFeatureBreadcrumb = observer(function ProjectFeatureBreadcrumb(
  props: TProjectFeatureBreadcrumbProps
) {
  const { workspaceSlug, projectId, featureKey, isLast = false, additionalNavigationItems } = props;
  // store hooks
  const { getPartialProjectById } = useProject();
  const { t } = useTranslation();
  // derived values
  const project = getPartialProjectById(projectId);

  if (!project) return null;

  const navigationItems = getProjectFeatureNavigation(workspaceSlug, projectId, project);

  // if additional navigation items are provided, add them to the navigation items
  const allNavigationItems = [...(additionalNavigationItems || []), ...navigationItems];

  const currentNavigationItem = allNavigationItems.find((item) => item.key === featureKey);
  const icon = currentNavigationItem?.icon as ReactNode;
  const label = currentNavigationItem?.i18n_key ? t(currentNavigationItem.i18n_key) : currentNavigationItem?.name;
  const href = currentNavigationItem?.href;

  return (
    <>
      <Breadcrumbs.Item
        component={
          <BreadcrumbLink
            key={featureKey}
            label={label}
            isLast={isLast}
            href={href}
            icon={<Breadcrumbs.Icon>{icon}</Breadcrumbs.Icon>}
          />
        }
        showSeparator={false}
        isLast={isLast}
      />
    </>
  );
});

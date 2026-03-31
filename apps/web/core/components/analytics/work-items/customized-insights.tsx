import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
// plane package imports
import { useTranslation } from "@plane/i18n";
import type { IAnalyticsParams } from "@plane/types";
import { ChartXAxisProperty } from "@plane/types";
import { cn } from "@plane/utils";
// plane web components
import AnalyticsSectionWrapper from "../analytics-section-wrapper";
import { AnalyticsSelectParams } from "../select/analytics-params";
import PriorityChart from "./priority-chart";

const CustomizedInsights = observer(function CustomizedInsights({
  peekView,
  projectId,
}: {
  peekView?: boolean;
  projectId?: string;
}) {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const { control, watch, setValue } = useForm<IAnalyticsParams>({
    defaultValues: {
      x_axis: ChartXAxisProperty.PRIORITY,
    },
  });

  const params = {
    x_axis: watch("x_axis"),
    issue_type_id: watch("issue_type_id"),
    issue_type_name: watch("issue_type_name"),
    group_by: watch("group_by"),
  };

  return (
    <AnalyticsSectionWrapper
      title={t("workspace_analytics.customized_insights")}
      className="col-span-1"
      headerClassName={cn(peekView ? "flex-col items-start" : "")}
      actions={
        <AnalyticsSelectParams
          control={control}
          setValue={setValue}
          params={params}
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId}
        />
      }
    >
      <PriorityChart
        x_axis={params.x_axis}
        issue_type_id={params.issue_type_id}
        issue_type_name={params.issue_type_name}
        group_by={params.group_by}
        projectId={projectId}
        workspaceSlug={workspaceSlug.toString()}
      />
    </AnalyticsSectionWrapper>
  );
});

export default CustomizedInsights;

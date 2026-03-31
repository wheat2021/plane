import { useEffect } from "react";
import { ANALYTICS_X_AXIS_VALUES } from "@plane/constants";
import type { TExtraPropertyConfig, TAnalyticsXAxisProperty } from "@plane/types";
import { store } from "@/lib/store-context";

/**
 * Returns combined X-axis / group-by options: static fields + extra properties (select + member).
 *
 * - projectId provided: only configs bound to that project's issue types
 * - projectId absent: all workspace configs, deduplicated by config key
 */
export function useAnalyticsXAxisOptions(
  workspaceSlug: string,
  projectId?: string
): { value: TAnalyticsXAxisProperty; label: string }[] {
  // Fetch workspace extra property configs
  useEffect(() => {
    if (!workspaceSlug) return;
    if (store.extraPropertyConfig.fetchedMap[workspaceSlug]) return;
    void store.extraPropertyConfig.fetchWorkspaceConfigs(workspaceSlug);
  }, [workspaceSlug]);

  // Fetch bindings for project issue types (only when projectId is present)
  useEffect(() => {
    if (!workspaceSlug || !projectId) return;
    const projectIssueTypes = store.issueType.getProjectIssueTypes(projectId) ?? [];
    for (const pit of projectIssueTypes) {
      const issueTypeId = pit.issue_type;
      if (!issueTypeId) continue;
      if (store.issueTypeExtraProperty.fetchedMap[projectId]?.[issueTypeId]) continue;
      void store.issueTypeExtraProperty.fetchBindings(workspaceSlug, projectId, issueTypeId);
    }
  }, [workspaceSlug, projectId]);

  const allConfigs = store.extraPropertyConfig.getConfigsByWorkspace(workspaceSlug);
  const eligibleConfigs = allConfigs.filter((c: TExtraPropertyConfig) => c.type === "select" || c.type === "member");

  let extraConfigs: TExtraPropertyConfig[];
  if (projectId) {
    // Filter to configs bound to any issue type in this project
    const projectIssueTypes = store.issueType.getProjectIssueTypes(projectId) ?? [];
    const boundConfigIds = new Set<string>();
    for (const pit of projectIssueTypes) {
      const issueTypeId = pit.issue_type;
      if (!issueTypeId) continue;
      const configIds = store.issueTypeExtraProperty.getConfigIdsByIssueType(projectId, issueTypeId);
      for (const id of configIds) boundConfigIds.add(id);
    }
    extraConfigs = eligibleConfigs.filter((c: TExtraPropertyConfig) => boundConfigIds.has(c.id));
  } else {
    // Workspace: deduplicate by config key
    const seenKeys = new Set<string>();
    extraConfigs = eligibleConfigs.filter((c: TExtraPropertyConfig) => {
      if (seenKeys.has(c.key)) return false;
      seenKeys.add(c.key);
      return true;
    });
  }

  const extraOptions = extraConfigs.map((c: TExtraPropertyConfig) => ({
    value: `extra_property:${c.key}` as TAnalyticsXAxisProperty,
    label: c.label,
  }));

  return [...ANALYTICS_X_AXIS_VALUES, ...extraOptions];
}

/**
 * Issue type filter options for the analytics chart.
 *
 * Returns `{ value, issueTypeName, label }` options where:
 * - value === undefined → "全部类型" (no filter)
 * - projectId provided → value is the issue type UUID (use issue_type_id param)
 * - projectId absent  → value is undefined, issueTypeName holds the name (use issue_type_name param)
 */
export function useAnalyticsIssueTypeOptions(
  workspaceSlug: string,
  projectId?: string
): { value: string | undefined; label: string; issueTypeName?: string }[] {
  const workspaceProjectIds = store.projectRoot.project.workspaceProjectIds ?? [];

  // Fetch issue types for project context
  useEffect(() => {
    if (!workspaceSlug || !projectId) return;
    if (store.issueType.fetchedMap[workspaceSlug]) return;
    void store.issueType.fetchProjectIssueTypes(workspaceSlug, projectId);
  }, [workspaceSlug, projectId]);

  // Fetch issue types for all workspace projects (workspace context)
  useEffect(() => {
    if (!workspaceSlug || projectId) return;
    if (store.issueType.fetchedMap[workspaceSlug]) return;
    for (const pid of workspaceProjectIds) {
      void store.issueType.fetchProjectIssueTypes(workspaceSlug, pid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, projectId, workspaceProjectIds.join(",")]);

  const allTypesOption = { value: undefined as string | undefined, label: "全部类型" };

  if (projectId) {
    const projectIssueTypes = store.issueType.getProjectIssueTypes(projectId) ?? [];
    const typeOptions = projectIssueTypes.map((pit) => ({
      value: pit.issue_type,
      label: pit.issue_type_detail?.name ?? pit.issue_type,
      issueTypeName: pit.issue_type_detail?.name,
    }));
    return [allTypesOption, ...typeOptions];
  }

  // Workspace: collect names from all projects, deduplicate
  const seenNames = new Set<string>();
  for (const pid of workspaceProjectIds) {
    const pits = store.issueType.getProjectIssueTypes(pid) ?? [];
    for (const pit of pits) {
      const name = pit.issue_type_detail?.name;
      if (name) seenNames.add(name);
    }
  }

  const typeOptions = Array.from(seenNames).map((name) => ({
    value: undefined as string | undefined,
    label: name,
    issueTypeName: name,
  }));

  return [allTypesOption, ...typeOptions];
}

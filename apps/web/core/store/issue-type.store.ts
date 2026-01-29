import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { TIssueType } from "@plane/types";
// services
import { IssueTypeService } from "@/services/issue-type.service";
import type { CoreRootStore } from "./root.store";

export interface IIssueTypeStore {
  // loaders
  fetchedMap: Record<string, boolean>;
  // observables
  issueTypeMap: Record<string, TIssueType>;
  // computed
  workspaceIssueTypes: TIssueType[] | undefined;
  // computed actions
  getIssueTypeById: (issueTypeId: string | null | undefined) => TIssueType | undefined;
  getWorkspaceIssueTypes: (workspaceSlug: string | null | undefined) => TIssueType[] | undefined;
  getDefaultIssueType: (workspaceSlug: string | null | undefined) => TIssueType | undefined;
  // fetch actions
  fetchWorkspaceIssueTypes: (workspaceSlug: string) => Promise<TIssueType[]>;
}

export class IssueTypeStore implements IIssueTypeStore {
  // observables
  issueTypeMap: Record<string, TIssueType> = {};
  // loaders
  fetchedMap: Record<string, boolean> = {};
  // root store
  rootStore: CoreRootStore;
  router;
  // service
  issueTypeService: IssueTypeService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      issueTypeMap: observable,
      fetchedMap: observable,
      // computed
      workspaceIssueTypes: computed,
      // fetch action
      fetchWorkspaceIssueTypes: action,
    });
    this.issueTypeService = new IssueTypeService();
    this.router = _rootStore.router;
    this.rootStore = _rootStore;
  }

  /**
   * Returns issue types for the current workspace
   */
  get workspaceIssueTypes() {
    const workspaceSlug = this.router.workspaceSlug || "";
    if (!workspaceSlug || !this.fetchedMap[workspaceSlug]) return undefined;
    return Object.values(this.issueTypeMap).filter((issueType) => issueType.is_active);
  }

  /**
   * Returns issue type by id
   */
  getIssueTypeById = computedFn((issueTypeId: string | null | undefined) => {
    if (!this.issueTypeMap || !issueTypeId) return undefined;
    return this.issueTypeMap[issueTypeId] ?? undefined;
  });

  /**
   * Returns issue types for a workspace
   */
  getWorkspaceIssueTypes = computedFn((workspaceSlug: string | null | undefined) => {
    if (!workspaceSlug || !this.fetchedMap[workspaceSlug]) return undefined;
    return Object.values(this.issueTypeMap).filter((issueType) => issueType.is_active);
  });

  /**
   * Returns the default issue type for a workspace
   */
  getDefaultIssueType = computedFn((workspaceSlug: string | null | undefined) => {
    const issueTypes = this.getWorkspaceIssueTypes(workspaceSlug);
    return issueTypes?.find((issueType) => issueType.is_default);
  });

  /**
   * Fetches issue types for a workspace
   */
  fetchWorkspaceIssueTypes = async (workspaceSlug: string) => {
    const issueTypesResponse = await this.issueTypeService.getWorkspaceIssueTypes(workspaceSlug);
    runInAction(() => {
      issueTypesResponse.forEach((issueType) => {
        set(this.issueTypeMap, [issueType.id], issueType);
      });
      set(this.fetchedMap, workspaceSlug, true);
    });
    return issueTypesResponse;
  };
}

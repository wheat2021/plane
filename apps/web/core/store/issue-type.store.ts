import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { TIssueType, TProjectIssueType } from "@plane/types";
// services
import { IssueTypeService } from "@/services/issue-type.service";
import type { CoreRootStore } from "./root.store";

export interface IIssueTypeStore {
  // loaders
  fetchedMap: Record<string, boolean>;
  projectFetchedMap: Record<string, boolean>;
  // observables
  issueTypeMap: Record<string, TIssueType>;
  projectIssueTypeMap: Record<string, Record<string, TProjectIssueType>>;
  // computed
  workspaceIssueTypes: TIssueType[] | undefined;
  // computed actions
  getIssueTypeById: (issueTypeId: string | null | undefined) => TIssueType | undefined;
  getWorkspaceIssueTypes: (workspaceSlug: string | null | undefined) => TIssueType[] | undefined;
  getDefaultIssueType: (workspaceSlug: string | null | undefined) => TIssueType | undefined;
  getProjectIssueTypes: (projectId: string | null | undefined) => TProjectIssueType[] | undefined;
  getProjectDefaultIssueType: (projectId: string | null | undefined) => TProjectIssueType | undefined;
  // fetch actions
  fetchWorkspaceIssueTypes: (workspaceSlug: string) => Promise<TIssueType[]>;
  fetchProjectIssueTypes: (workspaceSlug: string, projectId: string) => Promise<TProjectIssueType[]>;
  // CRUD actions
  addProjectIssueType: (workspaceSlug: string, projectId: string, issueTypeId: string) => Promise<TProjectIssueType>;
  updateProjectIssueType: (
    workspaceSlug: string,
    projectId: string,
    projectIssueTypeId: string,
    data: Partial<TProjectIssueType>
  ) => Promise<TProjectIssueType>;
  removeProjectIssueType: (
    workspaceSlug: string,
    projectId: string,
    projectIssueTypeId: string
  ) => Promise<{ migrated_count: number }>;
  // Workspace CRUD actions
  createWorkspaceIssueType: (workspaceSlug: string, data: Partial<TIssueType>) => Promise<TIssueType>;
  updateWorkspaceIssueType: (
    workspaceSlug: string,
    issueTypeId: string,
    data: Partial<TIssueType>
  ) => Promise<TIssueType>;
  deleteWorkspaceIssueType: (workspaceSlug: string, issueTypeId: string) => Promise<{ migrated_count: number }>;
}

export class IssueTypeStore implements IIssueTypeStore {
  // observables
  issueTypeMap: Record<string, TIssueType> = {};
  projectIssueTypeMap: Record<string, Record<string, TProjectIssueType>> = {};
  // loaders
  fetchedMap: Record<string, boolean> = {};
  projectFetchedMap: Record<string, boolean> = {};
  // root store
  rootStore: CoreRootStore;
  router;
  // service
  issueTypeService: IssueTypeService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      issueTypeMap: observable,
      projectIssueTypeMap: observable,
      fetchedMap: observable,
      projectFetchedMap: observable,
      // computed
      workspaceIssueTypes: computed,
      // fetch actions
      fetchWorkspaceIssueTypes: action,
      fetchProjectIssueTypes: action,
      // CRUD actions
      addProjectIssueType: action,
      updateProjectIssueType: action,
      removeProjectIssueType: action,
      // Workspace CRUD actions
      createWorkspaceIssueType: action,
      updateWorkspaceIssueType: action,
      deleteWorkspaceIssueType: action,
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

  /**
   * Returns project issue types for a project
   */
  getProjectIssueTypes = computedFn((projectId: string | null | undefined) => {
    if (!projectId || !this.projectFetchedMap[projectId]) return undefined;
    const projectTypes = this.projectIssueTypeMap[projectId];
    if (!projectTypes) return undefined;
    return Object.values(projectTypes).sort((a, b) => a.level - b.level);
  });

  /**
   * Returns the default issue type for a project
   */
  getProjectDefaultIssueType = computedFn((projectId: string | null | undefined) => {
    const projectIssueTypes = this.getProjectIssueTypes(projectId);
    return projectIssueTypes?.find((pit) => pit.is_default);
  });

  /**
   * Fetches issue types enabled for a project
   */
  fetchProjectIssueTypes = async (workspaceSlug: string, projectId: string) => {
    const response = await this.issueTypeService.getProjectIssueTypes(workspaceSlug, projectId);
    runInAction(() => {
      if (!this.projectIssueTypeMap[projectId]) {
        set(this.projectIssueTypeMap, projectId, {});
      }
      response.forEach((projectIssueType) => {
        set(this.projectIssueTypeMap, [projectId, projectIssueType.id], projectIssueType);
      });
      set(this.projectFetchedMap, projectId, true);
    });
    return response;
  };

  /**
   * Enables an issue type for a project
   */
  addProjectIssueType = async (workspaceSlug: string, projectId: string, issueTypeId: string) => {
    const response = await this.issueTypeService.addProjectIssueType(workspaceSlug, projectId, issueTypeId);
    runInAction(() => {
      if (!this.projectIssueTypeMap[projectId]) {
        set(this.projectIssueTypeMap, projectId, {});
      }
      set(this.projectIssueTypeMap, [projectId, response.id], response);
    });
    return response;
  };

  /**
   * Updates a project issue type configuration
   */
  updateProjectIssueType = async (
    workspaceSlug: string,
    projectId: string,
    projectIssueTypeId: string,
    data: Partial<TProjectIssueType>
  ) => {
    const response = await this.issueTypeService.updateProjectIssueType(
      workspaceSlug,
      projectId,
      projectIssueTypeId,
      data
    );
    runInAction(() => {
      // If setting as default, remove default from others
      if (data.is_default) {
        Object.keys(this.projectIssueTypeMap[projectId] || {}).forEach((id) => {
          if (id !== projectIssueTypeId && this.projectIssueTypeMap[projectId][id]) {
            set(this.projectIssueTypeMap, [projectId, id, "is_default"], false);
          }
        });
      }
      set(this.projectIssueTypeMap, [projectId, projectIssueTypeId], response);
    });
    return response;
  };

  /**
   * Creates a new workspace issue type
   */
  createWorkspaceIssueType = async (workspaceSlug: string, data: Partial<TIssueType>) => {
    const response = await this.issueTypeService.createWorkspaceIssueType(workspaceSlug, data);
    runInAction(() => {
      set(this.issueTypeMap, [response.id], response);
    });
    return response;
  };

  /**
   * Updates a workspace issue type
   */
  updateWorkspaceIssueType = async (workspaceSlug: string, issueTypeId: string, data: Partial<TIssueType>) => {
    const response = await this.issueTypeService.updateWorkspaceIssueType(workspaceSlug, issueTypeId, data);
    runInAction(() => {
      set(this.issueTypeMap, [issueTypeId], { ...this.issueTypeMap[issueTypeId], ...response });
    });
    return response;
  };

  /**
   * Deletes a workspace issue type (cascade migration)
   */
  deleteWorkspaceIssueType = async (workspaceSlug: string, issueTypeId: string) => {
    const response = await this.issueTypeService.deleteWorkspaceIssueType(workspaceSlug, issueTypeId);
    runInAction(() => {
      delete this.issueTypeMap[issueTypeId];
    });
    return response;
  };

  /**
   * Removes an issue type from a project
   */
  removeProjectIssueType = async (workspaceSlug: string, projectId: string, projectIssueTypeId: string) => {
    const projectIssueType = this.projectIssueTypeMap[projectId]?.[projectIssueTypeId];
    const wasDefault = projectIssueType?.is_default;

    const response = await this.issueTypeService.removeProjectIssueType(workspaceSlug, projectId, projectIssueTypeId);
    runInAction(() => {
      delete this.projectIssueTypeMap[projectId][projectIssueTypeId];

      // If deleted item was default, set first remaining one as default
      if (wasDefault) {
        const remaining = Object.values(this.projectIssueTypeMap[projectId] || {});
        if (remaining.length > 0) {
          const firstItem = remaining.sort((a, b) => a.level - b.level)[0];
          set(this.projectIssueTypeMap, [projectId, firstItem.id, "is_default"], true);
        }
      }
    });
    return response;
  };
}

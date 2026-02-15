import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { TIssueTypeExtraProperty, TIssueTypeExtraPropertyPayload } from "@plane/types";
// services
import { IssueTypeExtraPropertyService } from "@/services/issue-type-extra-property.service";
import type { CoreRootStore } from "./root.store";

export interface IIssueTypeExtraPropertyStore {
  // loaders
  fetchedMap: Record<string, Record<string, boolean>>; // projectId -> issueTypeId -> boolean
  // observables
  bindingMap: Record<string, TIssueTypeExtraProperty>; // bindingId -> binding
  projectIssueTypeBindingsMap: Record<string, Record<string, string[]>>; // projectId -> issueTypeId -> bindingId[]
  // computed actions
  getBindingById: (bindingId: string | null | undefined) => TIssueTypeExtraProperty | undefined;
  getBindings: (
    projectId: string | null | undefined,
    issueTypeId: string | null | undefined
  ) => TIssueTypeExtraProperty[];
  getConfigIdsByIssueType: (projectId: string | null | undefined, issueTypeId: string | null | undefined) => string[];
  // fetch actions
  fetchBindings: (workspaceSlug: string, projectId: string, issueTypeId: string) => Promise<TIssueTypeExtraProperty[]>;
  // CRUD actions
  createBinding: (
    workspaceSlug: string,
    projectId: string,
    issueTypeId: string,
    data: TIssueTypeExtraPropertyPayload
  ) => Promise<TIssueTypeExtraProperty>;
  updateBinding: (
    workspaceSlug: string,
    projectId: string,
    issueTypeId: string,
    bindingId: string,
    data: Partial<TIssueTypeExtraPropertyPayload>
  ) => Promise<TIssueTypeExtraProperty>;
  deleteBinding: (workspaceSlug: string, projectId: string, issueTypeId: string, bindingId: string) => Promise<void>;
}

export class IssueTypeExtraPropertyStore implements IIssueTypeExtraPropertyStore {
  // observables
  bindingMap: Record<string, TIssueTypeExtraProperty> = {};
  projectIssueTypeBindingsMap: Record<string, Record<string, string[]>> = {};
  // loaders
  fetchedMap: Record<string, Record<string, boolean>> = {};
  // root store
  rootStore: CoreRootStore;
  // service
  issueTypeExtraPropertyService: IssueTypeExtraPropertyService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      bindingMap: observable,
      projectIssueTypeBindingsMap: observable,
      fetchedMap: observable,
      // fetch actions
      fetchBindings: action,
      // CRUD actions
      createBinding: action,
      updateBinding: action,
      deleteBinding: action,
    });
    this.issueTypeExtraPropertyService = new IssueTypeExtraPropertyService();
    this.rootStore = _rootStore;
  }

  /**
   * Returns binding by id
   */
  getBindingById = computedFn((bindingId: string | null | undefined) => {
    if (!bindingId) return undefined;
    return this.bindingMap[bindingId] ?? undefined;
  });

  /**
   * Returns bindings for a project + issue type combination, sorted by sort_order
   */
  getBindings = computedFn((projectId: string | null | undefined, issueTypeId: string | null | undefined) => {
    if (!projectId || !issueTypeId) return [];
    const bindingIds = this.projectIssueTypeBindingsMap[projectId]?.[issueTypeId] || [];
    const bindings = bindingIds.map((id) => this.bindingMap[id]).filter(Boolean);
    return bindings.sort((a, b) => a.sort_order - b.sort_order);
  });

  /**
   * Returns config ids for a project + issue type combination
   */
  getConfigIdsByIssueType = computedFn(
    (projectId: string | null | undefined, issueTypeId: string | null | undefined) => {
      const bindings = this.getBindings(projectId, issueTypeId);
      return bindings.map((b) => b.extra_property_config);
    }
  );

  /**
   * Fetches bindings for a project + issue type
   */
  fetchBindings = async (workspaceSlug: string, projectId: string, issueTypeId: string) => {
    // Skip if already fetched
    if (this.fetchedMap[projectId]?.[issueTypeId]) {
      return this.getBindings(projectId, issueTypeId);
    }

    const response = await this.issueTypeExtraPropertyService.getBindings(workspaceSlug, projectId, issueTypeId);
    runInAction(() => {
      const bindingIds: string[] = [];
      response.forEach((binding) => {
        set(this.bindingMap, binding.id, binding);
        bindingIds.push(binding.id);
        // Also populate config map from nested detail if available
        if (binding.extra_property_config_detail) {
          set(
            this.rootStore.extraPropertyConfig.configMap,
            binding.extra_property_config,
            binding.extra_property_config_detail
          );
        }
      });
      if (!this.projectIssueTypeBindingsMap[projectId]) {
        set(this.projectIssueTypeBindingsMap, projectId, {});
      }
      set(this.projectIssueTypeBindingsMap[projectId], issueTypeId, bindingIds);
      if (!this.fetchedMap[projectId]) {
        set(this.fetchedMap, projectId, {});
      }
      set(this.fetchedMap[projectId], issueTypeId, true);
    });
    return response;
  };

  /**
   * Creates a new binding
   */
  createBinding = async (
    workspaceSlug: string,
    projectId: string,
    issueTypeId: string,
    data: TIssueTypeExtraPropertyPayload
  ) => {
    const response = await this.issueTypeExtraPropertyService.createBinding(
      workspaceSlug,
      projectId,
      issueTypeId,
      data
    );
    runInAction(() => {
      set(this.bindingMap, response.id, response);
      if (!this.projectIssueTypeBindingsMap[projectId]) {
        set(this.projectIssueTypeBindingsMap, projectId, {});
      }
      const bindingIds = this.projectIssueTypeBindingsMap[projectId]?.[issueTypeId] || [];
      set(this.projectIssueTypeBindingsMap[projectId], issueTypeId, [...bindingIds, response.id]);
      // Populate config from nested detail if available
      if (response.extra_property_config_detail) {
        set(
          this.rootStore.extraPropertyConfig.configMap,
          response.extra_property_config,
          response.extra_property_config_detail
        );
      }
    });
    return response;
  };

  /**
   * Updates a binding (is_required, sort_order)
   */
  updateBinding = async (
    workspaceSlug: string,
    projectId: string,
    issueTypeId: string,
    bindingId: string,
    data: Partial<TIssueTypeExtraPropertyPayload>
  ) => {
    const response = await this.issueTypeExtraPropertyService.updateBinding(
      workspaceSlug,
      projectId,
      issueTypeId,
      bindingId,
      data
    );
    runInAction(() => {
      set(this.bindingMap, response.id, response);
      // Populate config from nested detail if available
      if (response.extra_property_config_detail) {
        set(
          this.rootStore.extraPropertyConfig.configMap,
          response.extra_property_config,
          response.extra_property_config_detail
        );
      }
    });
    return response;
  };

  /**
   * Deletes a binding
   */
  deleteBinding = async (workspaceSlug: string, projectId: string, issueTypeId: string, bindingId: string) => {
    await this.issueTypeExtraPropertyService.deleteBinding(workspaceSlug, projectId, issueTypeId, bindingId);
    runInAction(() => {
      delete this.bindingMap[bindingId];
      const bindingIds = this.projectIssueTypeBindingsMap[projectId]?.[issueTypeId] || [];
      if (this.projectIssueTypeBindingsMap[projectId]) {
        set(
          this.projectIssueTypeBindingsMap[projectId],
          issueTypeId,
          bindingIds.filter((id) => id !== bindingId)
        );
      }
    });
  };
}

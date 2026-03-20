import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { TIssueTypeExtraProperty, TIssueTypeExtraPropertyPayload, TIssueExtraProperties } from "@plane/types";
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
  isConditionBinding: (bindingId: string) => boolean;
  isConditionMet: (
    projectId: string,
    issueTypeId: string,
    bindingId: string,
    issueExtraProperties: TIssueExtraProperties | undefined
  ) => boolean;
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
   * Returns whether a binding is a condition binding
   */
  isConditionBinding = computedFn((bindingId: string): boolean => {
    const binding = this.bindingMap[bindingId];
    return binding?.condition_config != null;
  });

  /**
   * Recursively checks if a condition binding's condition chain is satisfied
   */
  isConditionMet = computedFn(
    (
      projectId: string,
      issueTypeId: string,
      bindingId: string,
      issueExtraProperties: TIssueExtraProperties | undefined
    ): boolean => {
      const binding = this.bindingMap[bindingId];
      if (!binding || !binding.condition_config) return true; // normal binding always met

      const parentConfigId = binding.condition_config;
      const childConfigId = binding.extra_property_config;
      const triggerValues = this.rootStore.extraPropertyConfig.getTriggerValues(parentConfigId, childConfigId);
      if (triggerValues.size === 0) return true; // no trigger defined = always show

      // Get parent config to find its key
      const parentConfig = this.rootStore.extraPropertyConfig.getConfigById(parentConfigId);
      if (!parentConfig) return false;

      const parentValue = issueExtraProperties?.[parentConfig.key];

      // Check if parent value matches any trigger value
      let matched = false;
      if (parentConfig.type === "checkbox") {
        const boolStr = parentValue === true ? "true" : parentValue === false ? "false" : "";
        matched = triggerValues.has(boolStr);
      } else if (Array.isArray(parentValue)) {
        matched = parentValue.some((v) => triggerValues.has(String(v)));
      } else if (parentValue != null) {
        matched = triggerValues.has(String(parentValue));
      }

      if (!matched) return false;

      // Recursively check parent's condition chain
      const parentBinding = this.getBindings(projectId, issueTypeId).find(
        (b) => b.extra_property_config === parentConfigId
      );
      if (parentBinding && parentBinding.condition_config) {
        return this.isConditionMet(projectId, issueTypeId, parentBinding.id, issueExtraProperties);
      }
      return true;
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
   * Creates a new binding, then re-fetches all bindings to capture auto-created condition bindings
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
    // Re-fetch to capture auto-created condition bindings
    if (this.fetchedMap[projectId]) {
      delete this.fetchedMap[projectId][issueTypeId];
    }
    await this.fetchBindings(workspaceSlug, projectId, issueTypeId);
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
   * Deletes a binding, then re-fetches to reflect cascade-deleted condition bindings
   */
  deleteBinding = async (workspaceSlug: string, projectId: string, issueTypeId: string, bindingId: string) => {
    await this.issueTypeExtraPropertyService.deleteBinding(workspaceSlug, projectId, issueTypeId, bindingId);
    // Re-fetch to reflect cascade-deleted condition bindings
    if (this.fetchedMap[projectId]) {
      delete this.fetchedMap[projectId][issueTypeId];
    }
    await this.fetchBindings(workspaceSlug, projectId, issueTypeId);
  };
}

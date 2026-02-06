import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { TExtraPropertyConfig, TExtraPropertyConfigPayload } from "@plane/types";
// services
import { ExtraPropertyConfigService } from "@/services/extra-property-config.service";
import type { CoreRootStore } from "./root.store";

export interface IExtraPropertyConfigStore {
  // loaders
  fetchedMap: Record<string, boolean>; // issueTypeId -> boolean
  // observables
  configMap: Record<string, TExtraPropertyConfig>; // configId -> config
  issueTypeConfigsMap: Record<string, string[]>; // issueTypeId -> configId[]
  // computed actions
  getConfigById: (configId: string | null | undefined) => TExtraPropertyConfig | undefined;
  getConfigsByIssueType: (issueTypeId: string | null | undefined) => TExtraPropertyConfig[];
  // fetch actions
  fetchConfigsForIssueType: (workspaceSlug: string, issueTypeId: string) => Promise<TExtraPropertyConfig[]>;
  // CRUD actions
  createConfig: (
    workspaceSlug: string,
    issueTypeId: string,
    data: TExtraPropertyConfigPayload
  ) => Promise<TExtraPropertyConfig>;
  updateConfig: (
    workspaceSlug: string,
    issueTypeId: string,
    configId: string,
    data: TExtraPropertyConfigPayload
  ) => Promise<TExtraPropertyConfig>;
  deleteConfig: (workspaceSlug: string, issueTypeId: string, configId: string) => Promise<void>;
}

export class ExtraPropertyConfigStore implements IExtraPropertyConfigStore {
  // observables
  configMap: Record<string, TExtraPropertyConfig> = {};
  issueTypeConfigsMap: Record<string, string[]> = {};
  // loaders
  fetchedMap: Record<string, boolean> = {};
  // root store
  rootStore: CoreRootStore;
  // service
  extraPropertyConfigService: ExtraPropertyConfigService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      configMap: observable,
      issueTypeConfigsMap: observable,
      fetchedMap: observable,
      // fetch actions
      fetchConfigsForIssueType: action,
      // CRUD actions
      createConfig: action,
      updateConfig: action,
      deleteConfig: action,
    });
    this.extraPropertyConfigService = new ExtraPropertyConfigService();
    this.rootStore = _rootStore;
  }

  /**
   * Returns extra property config by id
   */
  getConfigById = computedFn((configId: string | null | undefined) => {
    if (!configId) return undefined;
    return this.configMap[configId] ?? undefined;
  });

  /**
   * Returns extra property configs for an issue type, sorted by sort_order
   */
  getConfigsByIssueType = computedFn((issueTypeId: string | null | undefined) => {
    if (!issueTypeId) return [];
    const configIds = this.issueTypeConfigsMap[issueTypeId] || [];
    const configs = configIds.map((id) => this.configMap[id]).filter(Boolean);
    return configs.sort((a, b) => a.sort_order - b.sort_order);
  });

  /**
   * Fetches extra property configs for an issue type
   */
  fetchConfigsForIssueType = async (workspaceSlug: string, issueTypeId: string) => {
    // Skip if already fetched
    if (this.fetchedMap[issueTypeId]) {
      return this.getConfigsByIssueType(issueTypeId);
    }

    const response = await this.extraPropertyConfigService.getConfigsForIssueType(workspaceSlug, issueTypeId);
    runInAction(() => {
      const configIds: string[] = [];
      response.forEach((config) => {
        set(this.configMap, config.id, config);
        configIds.push(config.id);
      });
      set(this.issueTypeConfigsMap, issueTypeId, configIds);
      set(this.fetchedMap, issueTypeId, true);
    });
    return response;
  };

  /**
   * Creates a new extra property config
   */
  createConfig = async (workspaceSlug: string, issueTypeId: string, data: TExtraPropertyConfigPayload) => {
    const response = await this.extraPropertyConfigService.createConfig(workspaceSlug, issueTypeId, data);
    runInAction(() => {
      set(this.configMap, response.id, response);
      const configIds = this.issueTypeConfigsMap[issueTypeId] || [];
      set(this.issueTypeConfigsMap, issueTypeId, [...configIds, response.id]);
    });
    return response;
  };

  /**
   * Updates an extra property config
   */
  updateConfig = async (
    workspaceSlug: string,
    issueTypeId: string,
    configId: string,
    data: TExtraPropertyConfigPayload
  ) => {
    const response = await this.extraPropertyConfigService.updateConfig(workspaceSlug, issueTypeId, configId, data);
    runInAction(() => {
      set(this.configMap, configId, response);
    });
    return response;
  };

  /**
   * Deletes an extra property config
   */
  deleteConfig = async (workspaceSlug: string, issueTypeId: string, configId: string) => {
    await this.extraPropertyConfigService.deleteConfig(workspaceSlug, issueTypeId, configId);
    runInAction(() => {
      delete this.configMap[configId];
      const configIds = this.issueTypeConfigsMap[issueTypeId] || [];
      set(
        this.issueTypeConfigsMap,
        issueTypeId,
        configIds.filter((id) => id !== configId)
      );
    });
  };
}

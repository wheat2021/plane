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
  fetchedMap: Record<string, boolean>; // workspaceSlug -> boolean
  // observables
  configMap: Record<string, TExtraPropertyConfig>; // configId -> config
  workspaceConfigsMap: Record<string, string[]>; // workspaceSlug -> configId[]
  // computed actions
  getConfigById: (configId: string | null | undefined) => TExtraPropertyConfig | undefined;
  getConfigsByWorkspace: (workspaceSlug: string | null | undefined) => TExtraPropertyConfig[];
  // fetch actions
  fetchWorkspaceConfigs: (workspaceSlug: string) => Promise<TExtraPropertyConfig[]>;
  fetchConfigValues: (workspaceSlug: string, configId: string) => Promise<{ count: number; distinct_values: string[] }>;
  // CRUD actions
  createConfig: (workspaceSlug: string, data: TExtraPropertyConfigPayload) => Promise<TExtraPropertyConfig>;
  updateConfig: (
    workspaceSlug: string,
    configId: string,
    data: TExtraPropertyConfigPayload
  ) => Promise<TExtraPropertyConfig>;
  deleteConfig: (workspaceSlug: string, configId: string) => Promise<void>;
}

export class ExtraPropertyConfigStore implements IExtraPropertyConfigStore {
  // observables
  configMap: Record<string, TExtraPropertyConfig> = {};
  workspaceConfigsMap: Record<string, string[]> = {};
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
      workspaceConfigsMap: observable,
      fetchedMap: observable,
      // fetch actions
      fetchWorkspaceConfigs: action,
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
   * Returns extra property configs for a workspace, sorted by sort_order
   */
  getConfigsByWorkspace = computedFn((workspaceSlug: string | null | undefined) => {
    if (!workspaceSlug) return [];
    const configIds = this.workspaceConfigsMap[workspaceSlug] || [];
    const configs = configIds.map((id) => this.configMap[id]).filter(Boolean);
    return configs.sort((a, b) => a.sort_order - b.sort_order);
  });

  /**
   * Fetches extra property configs for a workspace
   */
  fetchWorkspaceConfigs = async (workspaceSlug: string) => {
    // Skip if already fetched
    if (this.fetchedMap[workspaceSlug]) {
      return this.getConfigsByWorkspace(workspaceSlug);
    }

    const response = await this.extraPropertyConfigService.getConfigs(workspaceSlug);
    runInAction(() => {
      const configIds: string[] = [];
      response.forEach((config) => {
        set(this.configMap, config.id, config);
        configIds.push(config.id);
      });
      set(this.workspaceConfigsMap, workspaceSlug, configIds);
      set(this.fetchedMap, workspaceSlug, true);
    });
    return response;
  };

  /**
   * Fetches usage stats for an extra property config
   */
  fetchConfigValues = async (workspaceSlug: string, configId: string) =>
    this.extraPropertyConfigService.getConfigValues(workspaceSlug, configId);

  /**
   * Creates a new extra property config
   */
  createConfig = async (workspaceSlug: string, data: TExtraPropertyConfigPayload) => {
    const response = await this.extraPropertyConfigService.createConfig(workspaceSlug, data);
    runInAction(() => {
      set(this.configMap, response.id, response);
      const configIds = this.workspaceConfigsMap[workspaceSlug] || [];
      set(this.workspaceConfigsMap, workspaceSlug, [...configIds, response.id]);
    });
    return response;
  };

  /**
   * Updates an extra property config
   */
  updateConfig = async (workspaceSlug: string, configId: string, data: TExtraPropertyConfigPayload) => {
    const response = await this.extraPropertyConfigService.updateConfig(workspaceSlug, configId, data);
    runInAction(() => {
      set(this.configMap, configId, response);
    });
    return response;
  };

  /**
   * Deletes an extra property config
   */
  deleteConfig = async (workspaceSlug: string, configId: string) => {
    await this.extraPropertyConfigService.deleteConfig(workspaceSlug, configId);
    runInAction(() => {
      delete this.configMap[configId];
      const configIds = this.workspaceConfigsMap[workspaceSlug] || [];
      set(
        this.workspaceConfigsMap,
        workspaceSlug,
        configIds.filter((id) => id !== configId)
      );
    });
  };
}

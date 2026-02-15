// services
import { API_BASE_URL } from "@plane/constants";
import type { TExtraPropertyConfig, TExtraPropertyConfigPayload } from "@plane/types";
import { APIService } from "@/services/api.service";

export class ExtraPropertyConfigService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Fetches all extra property configs for a workspace
   * @param workspaceSlug - The workspace slug
   * @returns Promise<TExtraPropertyConfig[]>
   */
  async getConfigs(workspaceSlug: string): Promise<TExtraPropertyConfig[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/extra-properties/`)
      .then((response) => response?.data as TExtraPropertyConfig[])
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  /**
   * Fetches a single extra property config
   * @param workspaceSlug - The workspace slug
   * @param configId - The extra property config id
   * @returns Promise<TExtraPropertyConfig>
   */
  async getConfig(workspaceSlug: string, configId: string): Promise<TExtraPropertyConfig> {
    return this.get(`/api/workspaces/${workspaceSlug}/extra-properties/${configId}/`)
      .then((response) => response?.data as TExtraPropertyConfig)
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new extra property config for a workspace
   * @param workspaceSlug - The workspace slug
   * @param data - The config data
   * @returns Promise<TExtraPropertyConfig>
   */
  async createConfig(workspaceSlug: string, data: TExtraPropertyConfigPayload): Promise<TExtraPropertyConfig> {
    return this.post(`/api/workspaces/${workspaceSlug}/extra-properties/`, data)
      .then((response) => response?.data as TExtraPropertyConfig)
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates an extra property config
   * @param workspaceSlug - The workspace slug
   * @param configId - The config id
   * @param data - The data to update
   * @returns Promise<TExtraPropertyConfig>
   */
  async updateConfig(
    workspaceSlug: string,
    configId: string,
    data: TExtraPropertyConfigPayload
  ): Promise<TExtraPropertyConfig> {
    return this.patch(`/api/workspaces/${workspaceSlug}/extra-properties/${configId}/`, data)
      .then((response) => response?.data as TExtraPropertyConfig)
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes an extra property config
   * @param workspaceSlug - The workspace slug
   * @param configId - The config id
   * @returns Promise<void>
   */
  async deleteConfig(workspaceSlug: string, configId: string): Promise<void> {
    await this.delete(`/api/workspaces/${workspaceSlug}/extra-properties/${configId}/`).catch(
      (error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      }
    );
  }
}

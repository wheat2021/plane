// services
import { API_BASE_URL } from "@plane/constants";
import type { TExtraPropertyConfig, TExtraPropertyConfigPayload } from "@plane/types";
import { APIService } from "@/services/api.service";

export class ExtraPropertyConfigService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Fetches all extra property configs for an issue type
   * @param workspaceSlug - The workspace slug
   * @param issueTypeId - The issue type id
   * @returns Promise<TExtraPropertyConfig[]>
   */
  async getConfigsForIssueType(workspaceSlug: string, issueTypeId: string): Promise<TExtraPropertyConfig[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/issue-types/${issueTypeId}/extra-properties/`)
      .then((response) => response?.data as TExtraPropertyConfig[])
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  /**
   * Fetches a single extra property config
   * @param workspaceSlug - The workspace slug
   * @param issueTypeId - The issue type id
   * @param configId - The extra property config id
   * @returns Promise<TExtraPropertyConfig>
   */
  async getConfig(workspaceSlug: string, issueTypeId: string, configId: string): Promise<TExtraPropertyConfig> {
    return this.get(`/api/workspaces/${workspaceSlug}/issue-types/${issueTypeId}/extra-properties/${configId}/`)
      .then((response) => response?.data as TExtraPropertyConfig)
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new extra property config for an issue type
   * @param workspaceSlug - The workspace slug
   * @param issueTypeId - The issue type id
   * @param data - The config data
   * @returns Promise<TExtraPropertyConfig>
   */
  async createConfig(
    workspaceSlug: string,
    issueTypeId: string,
    data: TExtraPropertyConfigPayload
  ): Promise<TExtraPropertyConfig> {
    return this.post(`/api/workspaces/${workspaceSlug}/issue-types/${issueTypeId}/extra-properties/`, data)
      .then((response) => response?.data as TExtraPropertyConfig)
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates an extra property config
   * @param workspaceSlug - The workspace slug
   * @param issueTypeId - The issue type id
   * @param configId - The config id
   * @param data - The data to update
   * @returns Promise<TExtraPropertyConfig>
   */
  async updateConfig(
    workspaceSlug: string,
    issueTypeId: string,
    configId: string,
    data: TExtraPropertyConfigPayload
  ): Promise<TExtraPropertyConfig> {
    return this.patch(`/api/workspaces/${workspaceSlug}/issue-types/${issueTypeId}/extra-properties/${configId}/`, data)
      .then((response) => response?.data as TExtraPropertyConfig)
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes an extra property config
   * @param workspaceSlug - The workspace slug
   * @param issueTypeId - The issue type id
   * @param configId - The config id
   * @returns Promise<void>
   */
  async deleteConfig(workspaceSlug: string, issueTypeId: string, configId: string): Promise<void> {
    await this.delete(
      `/api/workspaces/${workspaceSlug}/issue-types/${issueTypeId}/extra-properties/${configId}/`
    ).catch((error: { response?: { data?: unknown } }) => {
      throw error?.response?.data;
    });
  }
}

// services
import { API_BASE_URL } from "@plane/constants";
import type { TIssueTypeExtraProperty, TIssueTypeExtraPropertyPayload } from "@plane/types";
import { APIService } from "@/services/api.service";

export class IssueTypeExtraPropertyService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Fetches all extra property bindings for an issue type in a project
   * @param workspaceSlug - The workspace slug
   * @param projectId - The project id
   * @param issueTypeId - The issue type id
   * @returns Promise<TIssueTypeExtraProperty[]>
   */
  async getBindings(workspaceSlug: string, projectId: string, issueTypeId: string): Promise<TIssueTypeExtraProperty[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${issueTypeId}/extra-properties/`
    )
      .then((response) => response?.data as TIssueTypeExtraProperty[])
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new extra property binding for an issue type in a project
   * @param workspaceSlug - The workspace slug
   * @param projectId - The project id
   * @param issueTypeId - The issue type id
   * @param data - The binding data (extra_property_config id)
   * @returns Promise<TIssueTypeExtraProperty>
   */
  async createBinding(
    workspaceSlug: string,
    projectId: string,
    issueTypeId: string,
    data: TIssueTypeExtraPropertyPayload
  ): Promise<TIssueTypeExtraProperty> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${issueTypeId}/extra-properties/`,
      data
    )
      .then((response) => response?.data as TIssueTypeExtraProperty)
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates an extra property binding (is_required, sort_order)
   * @param workspaceSlug - The workspace slug
   * @param projectId - The project id
   * @param issueTypeId - The issue type id
   * @param bindingId - The binding id
   * @param data - The partial binding data to update
   * @returns Promise<TIssueTypeExtraProperty>
   */
  async updateBinding(
    workspaceSlug: string,
    projectId: string,
    issueTypeId: string,
    bindingId: string,
    data: Partial<TIssueTypeExtraPropertyPayload>
  ): Promise<TIssueTypeExtraProperty> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${issueTypeId}/extra-properties/${bindingId}/`,
      data
    )
      .then((response) => response?.data as TIssueTypeExtraProperty)
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes an extra property binding
   * @param workspaceSlug - The workspace slug
   * @param projectId - The project id
   * @param issueTypeId - The issue type id
   * @param bindingId - The binding id
   * @returns Promise<void>
   */
  async deleteBinding(workspaceSlug: string, projectId: string, issueTypeId: string, bindingId: string): Promise<void> {
    await this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${issueTypeId}/extra-properties/${bindingId}/`
    ).catch((error: { response?: { data?: unknown } }) => {
      throw error?.response?.data;
    });
  }
}

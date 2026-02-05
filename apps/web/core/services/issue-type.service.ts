// services
import { API_BASE_URL } from "@plane/constants";
import type { TIssueType, TProjectIssueType } from "@plane/types";
import { APIService } from "@/services/api.service";

export class IssueTypeService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Fetches all issue types for a workspace
   * @param workspaceSlug - The workspace slug
   * @returns Promise<TIssueType[]>
   */
  async getWorkspaceIssueTypes(workspaceSlug: string): Promise<TIssueType[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/issue-types/`)
      .then((response) => response?.data as TIssueType[])
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  /**
   * Fetches all issue types enabled for a project
   * @param workspaceSlug - The workspace slug
   * @param projectId - The project id
   * @returns Promise<TProjectIssueType[]>
   */
  async getProjectIssueTypes(workspaceSlug: string, projectId: string): Promise<TProjectIssueType[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/`)
      .then((response) => response?.data as TProjectIssueType[])
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  /**
   * Enables an issue type for a project
   * @param workspaceSlug - The workspace slug
   * @param projectId - The project id
   * @param issueTypeId - The issue type id to enable
   * @returns Promise<TProjectIssueType>
   */
  async addProjectIssueType(workspaceSlug: string, projectId: string, issueTypeId: string): Promise<TProjectIssueType> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/`, {
      issue_type: issueTypeId,
    })
      .then((response) => response?.data as TProjectIssueType)
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates a project issue type configuration
   * @param workspaceSlug - The workspace slug
   * @param projectId - The project id
   * @param projectIssueTypeId - The project issue type id
   * @param data - The data to update
   * @returns Promise<TProjectIssueType>
   */
  async updateProjectIssueType(
    workspaceSlug: string,
    projectId: string,
    projectIssueTypeId: string,
    data: Partial<TProjectIssueType>
  ): Promise<TProjectIssueType> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${projectIssueTypeId}/`, data)
      .then((response) => response?.data as TProjectIssueType)
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  /**
   * Removes an issue type from a project
   * @param workspaceSlug - The workspace slug
   * @param projectId - The project id
   * @param projectIssueTypeId - The project issue type id
   * @returns Promise<void>
   */
  async removeProjectIssueType(
    workspaceSlug: string,
    projectId: string,
    projectIssueTypeId: string
  ): Promise<{ migrated_count: number }> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${projectIssueTypeId}/`)
      .then((response) => response?.data as { migrated_count: number })
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }
}

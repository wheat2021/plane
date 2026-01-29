// services
import { API_BASE_URL } from "@plane/constants";
import type { TIssueType } from "@plane/types";
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
}

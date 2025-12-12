# Django imports
from django.db import IntegrityError

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import (
    IssueTypeSerializer,
    ProjectIssueTypeSerializer,
    ProjectIssueTypeDetailSerializer,
)
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Issue, IssueType, ProjectIssueType
from .base import BaseAPIView


class IssueTypeListCreateAPIEndpoint(BaseAPIView):
    """Issue Type List and Create Endpoint"""

    serializer_class = ProjectIssueTypeDetailSerializer
    model = ProjectIssueType
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            ProjectIssueType.objects.filter(
                project__workspace__slug=self.kwargs.get("slug")
            )
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .select_related("issue_type")
            .select_related("project")
            .distinct()
        )

    def post(self, request, slug, project_id):
        """Create issue type

        Create a new work item type for a project. The type is first created
        at the workspace level if it doesn't exist, then associated with the project.
        """
        try:
            # Get workspace from project
            from plane.db.models import Project
            project = Project.objects.get(pk=project_id, workspace__slug=slug)
            workspace_id = project.workspace_id

            # Check if this is a new type or existing type
            issue_type_id = request.data.get("issue_type_id")

            if issue_type_id:
                # Associate existing workspace-level type with project
                issue_type = IssueType.objects.get(
                    pk=issue_type_id, workspace_id=workspace_id
                )
            else:
                # Create new workspace-level type
                type_serializer = IssueTypeSerializer(data=request.data)
                if type_serializer.is_valid():
                    # Check for duplicate external ID
                    if (
                        request.data.get("external_id")
                        and request.data.get("external_source")
                        and IssueType.objects.filter(
                            workspace_id=workspace_id,
                            external_source=request.data.get("external_source"),
                            external_id=request.data.get("external_id"),
                        ).exists()
                    ):
                        existing_type = IssueType.objects.filter(
                            workspace_id=workspace_id,
                            external_id=request.data.get("external_id"),
                            external_source=request.data.get("external_source"),
                        ).first()
                        return Response(
                            {
                                "error": "Issue type with the same external id and external source already exists",
                                "id": str(existing_type.id),
                            },
                            status=status.HTTP_409_CONFLICT,
                        )

                    issue_type = type_serializer.save(workspace_id=workspace_id)
                else:
                    return Response(
                        type_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                    )

            # Create project-issue type association
            project_type_serializer = ProjectIssueTypeSerializer(
                data={
                    "issue_type_id": issue_type.id,
                    "is_default": request.data.get("is_default", False),
                    "level": request.data.get("level", 0),
                },
                context={"project_id": project_id},
            )

            if project_type_serializer.is_valid():
                project_type_serializer.save(project_id=project_id)
                # Return detailed response
                project_issue_type = ProjectIssueType.objects.get(
                    pk=project_type_serializer.data["id"]
                )
                response_serializer = ProjectIssueTypeDetailSerializer(
                    project_issue_type
                )
                return Response(response_serializer.data, status=status.HTTP_200_OK)
            return Response(
                project_type_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        except IntegrityError:
            return Response(
                {
                    "error": "This issue type is already associated with the project",
                },
                status=status.HTTP_409_CONFLICT,
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def get(self, request, slug, project_id):
        """List issue types

        Retrieve all work item types associated with a project.
        Returns both active and inactive types.
        """
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda types: ProjectIssueTypeDetailSerializer(
                types, many=True, fields=self.fields, expand=self.expand
            ).data,
        )


class IssueTypeDetailAPIEndpoint(BaseAPIView):
    """Issue Type Detail Endpoint"""

    serializer_class = ProjectIssueTypeDetailSerializer
    model = ProjectIssueType
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            ProjectIssueType.objects.filter(
                project__workspace__slug=self.kwargs.get("slug")
            )
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .select_related("issue_type")
            .select_related("project")
            .distinct()
        )

    def get(self, request, slug, project_id, type_id):
        """Retrieve issue type

        Retrieve details of a specific work item type associated with a project.
        """
        serializer = ProjectIssueTypeDetailSerializer(
            self.get_queryset().get(pk=type_id),
            fields=self.fields,
            expand=self.expand,
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug, project_id, type_id):
        """Delete issue type

        Remove a work item type association from a project.
        Default types and types with existing work items cannot be deleted.
        """
        project_type = ProjectIssueType.objects.get(
            pk=type_id, project_id=project_id, project__workspace__slug=slug
        )

        if project_type.is_default:
            return Response(
                {"error": "Default issue type cannot be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for any issues with this type
        issue_exist = Issue.objects.filter(
            project_id=project_id, type=project_type.issue_type
        ).exists()

        if issue_exist:
            return Response(
                {
                    "error": "This issue type has work items associated with it. Only empty types can be deleted"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        project_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, slug, project_id, type_id):
        """Update issue type

        Update properties of a work item type association.
        Can update default status, level, and other project-specific settings.
        """
        project_type = ProjectIssueType.objects.get(
            project__workspace__slug=slug, project_id=project_id, pk=type_id
        )

        # Update project-level settings
        serializer = ProjectIssueTypeSerializer(
            project_type, data=request.data, partial=True, context={"project_id": project_id}
        )

        if serializer.is_valid():
            serializer.save()

            # If updating the underlying issue type
            if "name" in request.data or "description" in request.data or "logo_props" in request.data:
                issue_type = project_type.issue_type
                type_serializer = IssueTypeSerializer(
                    issue_type,
                    data={
                        k: v
                        for k, v in request.data.items()
                        if k in ["name", "description", "logo_props", "is_active", "level"]
                    },
                    partial=True,
                )
                if type_serializer.is_valid():
                    type_serializer.save()
                else:
                    return Response(
                        type_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                    )

            # Return detailed response
            project_issue_type = ProjectIssueType.objects.get(pk=type_id)
            response_serializer = ProjectIssueTypeDetailSerializer(project_issue_type)
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

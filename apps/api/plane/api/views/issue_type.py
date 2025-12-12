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

    serializer_class = IssueTypeSerializer
    model = IssueType
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        # Get issue types that are associated with this project
        project_issue_types = ProjectIssueType.objects.filter(
            project__workspace__slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
        ).values_list("issue_type_id", flat=True)

        return (
            IssueType.objects.filter(
                id__in=project_issue_types,
                workspace__slug=self.kwargs.get("slug")
            )
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
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"Creating IssueTypeSerializer with data: {request.data}")

                type_serializer = IssueTypeSerializer(data=request.data)
                logger.info(f"Serializer fields: {type_serializer.fields.keys()}")
                logger.info(f"Calling is_valid()...")

                if type_serializer.is_valid():
                    logger.info(f"Validation passed!")
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
                # Return the IssueType object to match business API
                response_serializer = IssueTypeSerializer(issue_type)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
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
            on_results=lambda types: IssueTypeSerializer(
                types, many=True, fields=self.fields, expand=self.expand
            ).data,
        )


class IssueTypeDetailAPIEndpoint(BaseAPIView):
    """Issue Type Detail Endpoint"""

    serializer_class = IssueTypeSerializer
    model = IssueType
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        # Get issue types that are associated with this project
        project_issue_types = ProjectIssueType.objects.filter(
            project__workspace__slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
        ).values_list("issue_type_id", flat=True)

        return (
            IssueType.objects.filter(
                id__in=project_issue_types,
                workspace__slug=self.kwargs.get("slug")
            )
            .distinct()
        )

    def get(self, request, slug, project_id, type_id):
        """Retrieve issue type

        Retrieve details of a specific work item type associated with a project.
        """
        serializer = IssueTypeSerializer(
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
        # Get the issue type
        issue_type = self.get_queryset().get(pk=type_id)

        # Find the project-issue type association
        project_type = ProjectIssueType.objects.get(
            issue_type_id=type_id, project_id=project_id, project__workspace__slug=slug
        )

        if project_type.is_default:
            return Response(
                {"error": "Default issue type cannot be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for any issues with this type
        issue_exist = Issue.objects.filter(
            project_id=project_id, type=issue_type
        ).exists()

        if issue_exist:
            return Response(
                {
                    "error": "This issue type has work items associated with it. Only empty types can be deleted"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Delete the association (not the issue type itself)
        project_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, slug, project_id, type_id):
        """Update issue type

        Update properties of a work item type.
        Can update name, description, logo_props, and other type settings.
        """
        # Get the issue type
        issue_type = self.get_queryset().get(pk=type_id)

        # Find the project-issue type association for is_default handling
        try:
            project_type = ProjectIssueType.objects.get(
                issue_type_id=type_id, project_id=project_id, project__workspace__slug=slug
            )
        except ProjectIssueType.DoesNotExist:
            return Response(
                {"error": "Issue type not found for this project"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Update the IssueType
        type_serializer = IssueTypeSerializer(
            issue_type,
            data=request.data,
            partial=True,
        )

        if type_serializer.is_valid():
            type_serializer.save()

            # Handle is_default at project level if provided
            if "is_default" in request.data:
                project_serializer = ProjectIssueTypeSerializer(
                    project_type,
                    data={"is_default": request.data["is_default"]},
                    partial=True,
                    context={"project_id": project_id}
                )
                if project_serializer.is_valid():
                    project_serializer.save()

            # Handle level at project level if provided
            if "level" in request.data:
                project_serializer = ProjectIssueTypeSerializer(
                    project_type,
                    data={"level": request.data["level"]},
                    partial=True,
                    context={"project_id": project_id}
                )
                if project_serializer.is_valid():
                    project_serializer.save()

            # Return updated IssueType
            updated_issue_type = IssueType.objects.get(pk=type_id)
            response_serializer = IssueTypeSerializer(updated_issue_type)
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        return Response(type_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

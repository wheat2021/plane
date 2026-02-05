# Django imports
from django.db import transaction

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.app.views.base import BaseAPIView
from plane.app.serializers import ProjectIssueTypeSerializer, IssueTypeSerializer
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import Issue, IssueType, ProjectIssueType


class ProjectIssueTypesEndpoint(BaseAPIView):
    """
    Endpoint to manage issue types for a project.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        """List all issue types enabled for a project."""
        project_issue_types = ProjectIssueType.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
        ).select_related("issue_type").order_by("level", "issue_type__name")

        serializer = ProjectIssueTypeSerializer(project_issue_types, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id):
        """Enable an issue type for a project."""
        issue_type_id = request.data.get("issue_type")

        if not issue_type_id:
            return Response(
                {"error": "issue_type is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify issue type exists and belongs to the workspace
        issue_type = IssueType.objects.filter(
            id=issue_type_id,
            workspace__slug=slug,
            is_active=True,
        ).first()

        if not issue_type:
            return Response(
                {"error": "Issue type not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if already enabled
        if ProjectIssueType.objects.filter(
            project_id=project_id,
            issue_type_id=issue_type_id,
        ).exists():
            return Response(
                {"error": "Issue type already enabled for this project"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the max level for ordering
        max_level = ProjectIssueType.objects.filter(
            project_id=project_id,
        ).order_by("-level").values_list("level", flat=True).first() or 0

        # Check if this should be the default (first one added)
        is_default = not ProjectIssueType.objects.filter(project_id=project_id).exists()

        project_issue_type = ProjectIssueType.objects.create(
            workspace_id=issue_type.workspace_id,
            project_id=project_id,
            issue_type_id=issue_type_id,
            level=max_level + 1,
            is_default=is_default,
        )

        serializer = ProjectIssueTypeSerializer(project_issue_type)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectIssueTypeDetailEndpoint(BaseAPIView):
    """
    Endpoint to manage a single project issue type.
    """

    @allow_permission([ROLE.ADMIN])
    def patch(self, request, slug, project_id, pk):
        """Update a project issue type (e.g., set as default)."""
        project_issue_type = ProjectIssueType.objects.filter(
            pk=pk,
            workspace__slug=slug,
            project_id=project_id,
        ).first()

        if not project_issue_type:
            return Response(
                {"error": "Project issue type not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Handle setting as default
        if request.data.get("is_default"):
            # Remove default from other project issue types
            ProjectIssueType.objects.filter(
                project_id=project_id,
                is_default=True,
            ).update(is_default=False)

        serializer = ProjectIssueTypeSerializer(
            project_issue_type,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN])
    def delete(self, request, slug, project_id, pk):
        """Remove an issue type from a project, migrating existing issues."""
        project_issue_type = ProjectIssueType.objects.filter(
            pk=pk,
            workspace__slug=slug,
            project_id=project_id,
        ).select_related("issue_type").first()

        if not project_issue_type:
            return Response(
                {"error": "Project issue type not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Prevent disabling Task type
        if project_issue_type.issue_type.name.lower() == "task":
            return Response(
                {"error": "Task type cannot be disabled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issue_type_id = project_issue_type.issue_type_id
        was_default = project_issue_type.is_default

        # Find migration target: project default type, excluding the one being disabled
        migration_target = ProjectIssueType.objects.filter(
            project_id=project_id,
            is_default=True,
        ).exclude(pk=pk).select_related("issue_type").first()

        if not migration_target:
            # Fall back to any other enabled type
            migration_target = ProjectIssueType.objects.filter(
                project_id=project_id,
            ).exclude(pk=pk).order_by("level").select_related("issue_type").first()

        if not migration_target:
            return Response(
                {"error": "Cannot disable the only enabled type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # Migrate issues from the disabled type to the migration target
            migrated_count = Issue.issue_objects.filter(
                project_id=project_id,
                type_id=issue_type_id,
            ).update(type_id=migration_target.issue_type_id)

            # Delete the project issue type
            project_issue_type.delete()

            # If deleted item was default, set migration target as default
            if was_default:
                migration_target.is_default = True
                migration_target.save(update_fields=["is_default"])

        return Response(
            {"migrated_count": migrated_count},
            status=status.HTTP_200_OK,
        )

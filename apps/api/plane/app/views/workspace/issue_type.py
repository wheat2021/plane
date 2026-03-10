# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Django imports
from django.db import transaction

# Module imports
from plane.app.views.base import BaseAPIView
from plane.app.serializers import IssueTypeSerializer
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import IssueType, ProjectIssueType, Issue


class WorkspaceIssueTypesEndpoint(BaseAPIView):
    """
    Endpoint to list and create issue types for a workspace.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        issue_types = IssueType.objects.filter(
            workspace__slug=slug,
            is_active=True,
        ).order_by("level", "name")

        serializer = IssueTypeSerializer(issue_types, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = request.user.workspaces.get(slug=slug)
        serializer = IssueTypeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Check for duplicate name (including soft-deleted)
        if IssueType.objects.filter(workspace=workspace, name=serializer.validated_data["name"]).exists():
            return Response(
                {"name": ["该名称已被使用"]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issue_type = serializer.save(workspace=workspace, is_system=False)
        return Response(IssueTypeSerializer(issue_type).data, status=status.HTTP_201_CREATED)


class WorkspaceIssueTypeDetailEndpoint(BaseAPIView):
    """
    Endpoint to retrieve, update, and delete a specific issue type.
    """

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, pk):
        issue_type = IssueType.objects.get(workspace__slug=slug, pk=pk)

        data = request.data.copy()
        # System types: name is read-only, silently ignore name changes
        if issue_type.is_system:
            data.pop("name", None)

        serializer = IssueTypeSerializer(issue_type, data=data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Check for duplicate name if name is being changed
        new_name = serializer.validated_data.get("name")
        if new_name and new_name != issue_type.name:
            if IssueType.objects.filter(workspace__slug=slug, name=new_name).exclude(pk=pk).exists():
                return Response(
                    {"name": ["该名称已被使用"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        issue_type = serializer.save()
        return Response(IssueTypeSerializer(issue_type).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, pk):
        issue_type = IssueType.objects.get(workspace__slug=slug, pk=pk)

        if issue_type.is_system:
            return Response(
                {"error": "系统内置类型不可删除"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # Find all projects that have this type enabled
            project_issue_types = ProjectIssueType.objects.filter(
                issue_type=issue_type,
                deleted_at__isnull=True,
            ).select_related("project")

            # Check if any project only has this type enabled
            blocked_projects = []
            for pit in project_issue_types:
                active_count = ProjectIssueType.objects.filter(
                    project=pit.project,
                    deleted_at__isnull=True,
                ).count()
                if active_count <= 1:
                    blocked_projects.append(pit.project.name)

            if blocked_projects:
                return Response(
                    {
                        "error": "请先为以下项目启用其他工作项类型",
                        "blocked_projects": blocked_projects,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Migrate issues to each project's default type
            migrated_count = 0
            for pit in project_issue_types:
                default_pit = ProjectIssueType.objects.filter(
                    project=pit.project,
                    is_default=True,
                    deleted_at__isnull=True,
                ).exclude(issue_type=issue_type).first()

                if not default_pit:
                    # Fall back to any other active type
                    default_pit = ProjectIssueType.objects.filter(
                        project=pit.project,
                        deleted_at__isnull=True,
                    ).exclude(issue_type=issue_type).first()

                if default_pit:
                    count = Issue.objects.filter(
                        project=pit.project,
                        type=issue_type,
                    ).update(type=default_pit.issue_type)
                    migrated_count += count

            # Delete all ProjectIssueType bindings
            project_issue_types.delete()

            # Soft delete the issue type
            issue_type.is_active = False
            issue_type.save(update_fields=["is_active"])

        return Response(
            {"migrated_count": migrated_count},
            status=status.HTTP_200_OK,
        )


class WorkspaceIssueTypeUsageSummaryEndpoint(BaseAPIView):
    """
    Endpoint to get usage summary before deleting an issue type.
    """

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug, pk):
        issue_type = IssueType.objects.get(workspace__slug=slug, pk=pk)

        project_issue_types = ProjectIssueType.objects.filter(
            issue_type=issue_type,
            deleted_at__isnull=True,
        ).select_related("project")

        affected_projects = project_issue_types.count()
        affected_issues = Issue.objects.filter(type=issue_type).count()

        return Response(
            {
                "affected_projects": affected_projects,
                "affected_issues": affected_issues,
            },
            status=status.HTTP_200_OK,
        )

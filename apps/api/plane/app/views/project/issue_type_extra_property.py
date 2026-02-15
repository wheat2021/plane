# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.app.views.base import BaseAPIView
from plane.app.serializers import IssueTypeExtraPropertySerializer
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import IssueTypeExtraProperty, Project, IssueType


class IssueTypeExtraPropertyEndpoint(BaseAPIView):
    """
    Endpoint to manage extra property bindings for an issue type within a project.

    GET /api/workspaces/{slug}/projects/{project_id}/issue-types/{issue_type_id}/extra-properties/
    POST /api/workspaces/{slug}/projects/{project_id}/issue-types/{issue_type_id}/extra-properties/
    """

    def get_queryset(self):
        return IssueTypeExtraProperty.objects.filter(
            project_id=self.kwargs.get("project_id"),
            issue_type_id=self.kwargs.get("issue_type_id"),
            project__workspace__slug=self.kwargs.get("slug"),
        ).select_related("extra_property_config").order_by("sort_order", "created_at")

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id, issue_type_id):
        """List all extra property bindings for an issue type in a project."""
        bindings = self.get_queryset()
        serializer = IssueTypeExtraPropertySerializer(bindings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    def post(self, request, slug, project_id, issue_type_id):
        """Create a new extra property binding for an issue type in a project."""
        # Validate project exists and belongs to workspace
        try:
            project = Project.objects.get(
                id=project_id,
                workspace__slug=slug,
            )
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Validate issue type exists and belongs to workspace
        try:
            issue_type = IssueType.objects.get(
                id=issue_type_id,
                workspace__slug=slug,
            )
        except IssueType.DoesNotExist:
            return Response(
                {"error": "Issue type not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = IssueTypeExtraPropertySerializer(
            data=request.data,
            context={
                "project_id": project.id,
                "issue_type_id": issue_type.id,
            },
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IssueTypeExtraPropertyDetailEndpoint(BaseAPIView):
    """
    Endpoint to manage a single extra property binding.

    PATCH /api/workspaces/{slug}/projects/{project_id}/issue-types/{issue_type_id}/extra-properties/{pk}/
    DELETE /api/workspaces/{slug}/projects/{project_id}/issue-types/{issue_type_id}/extra-properties/{pk}/
    """

    def get_object(self):
        return IssueTypeExtraProperty.objects.select_related("extra_property_config").get(
            id=self.kwargs.get("pk"),
            project_id=self.kwargs.get("project_id"),
            issue_type_id=self.kwargs.get("issue_type_id"),
            project__workspace__slug=self.kwargs.get("slug"),
        )

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    def patch(self, request, slug, project_id, issue_type_id, pk):
        """Update an extra property binding (is_required, sort_order)."""
        try:
            binding = self.get_object()
        except IssueTypeExtraProperty.DoesNotExist:
            return Response(
                {"error": "Extra property binding not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = IssueTypeExtraPropertySerializer(
            binding,
            data=request.data,
            partial=True,
            context={
                "project_id": project_id,
                "issue_type_id": issue_type_id,
            },
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    def delete(self, request, slug, project_id, issue_type_id, pk):
        """Delete an extra property binding."""
        try:
            binding = self.get_object()
        except IssueTypeExtraProperty.DoesNotExist:
            return Response(
                {"error": "Extra property binding not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        binding.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.app.views.base import BaseAPIView
from plane.app.serializers import IssueTypeSerializer
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import IssueType


class WorkspaceIssueTypesEndpoint(BaseAPIView):
    """
    Endpoint to list all issue types for a workspace.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        issue_types = IssueType.objects.filter(
            workspace__slug=slug,
            is_active=True,
        ).order_by("level", "name")

        serializer = IssueTypeSerializer(issue_types, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

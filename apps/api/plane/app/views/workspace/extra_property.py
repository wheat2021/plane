# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.app.views.base import BaseAPIView
from plane.app.serializers import ExtraPropertyConfigSerializer
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import ExtraPropertyConfig, Workspace


class ExtraPropertyConfigEndpoint(BaseAPIView):
    """
    Endpoint to manage extra property configurations at workspace level.

    GET /api/workspaces/{slug}/extra-properties/
    POST /api/workspaces/{slug}/extra-properties/
    """

    def get_queryset(self):
        return ExtraPropertyConfig.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
        ).order_by("sort_order", "created_at")

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        """List all extra property configs for the workspace."""
        configs = self.get_queryset()
        serializer = ExtraPropertyConfigSerializer(configs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        """Create a new extra property config for the workspace."""
        workspace = Workspace.objects.get(slug=slug)

        serializer = ExtraPropertyConfigSerializer(
            data=request.data,
            context={
                "workspace_id": workspace.id,
            },
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExtraPropertyConfigDetailEndpoint(BaseAPIView):
    """
    Endpoint to manage a single extra property configuration.

    GET /api/workspaces/{slug}/extra-properties/{pk}/
    PATCH /api/workspaces/{slug}/extra-properties/{pk}/
    DELETE /api/workspaces/{slug}/extra-properties/{pk}/
    """

    def get_object(self):
        return ExtraPropertyConfig.objects.get(
            id=self.kwargs.get("pk"),
            workspace__slug=self.kwargs.get("slug"),
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, pk):
        """Get a single extra property config."""
        try:
            config = self.get_object()
        except ExtraPropertyConfig.DoesNotExist:
            return Response(
                {"error": "Extra property config not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ExtraPropertyConfigSerializer(config)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, pk):
        """Update an extra property config."""
        try:
            config = self.get_object()
        except ExtraPropertyConfig.DoesNotExist:
            return Response(
                {"error": "Extra property config not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ExtraPropertyConfigSerializer(
            config,
            data=request.data,
            partial=True,
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, pk):
        """Delete an extra property config."""
        try:
            config = self.get_object()
        except ExtraPropertyConfig.DoesNotExist:
            return Response(
                {"error": "Extra property config not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        config.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

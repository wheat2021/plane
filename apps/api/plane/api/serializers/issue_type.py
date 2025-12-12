# Module imports
from .base import BaseSerializer
from plane.db.models import IssueType, ProjectIssueType
from rest_framework import serializers


class IssueTypeSerializer(BaseSerializer):
    """
    Serializer for work item types.

    Handles issue type creation and updates at the workspace level.
    Each workspace can have multiple issue types with unique names.
    """

    workspace = serializers.UUIDField(read_only=True)

    class Meta:
        model = IssueType
        fields = [
            "id",
            "name",
            "description",
            "logo_props",
            "is_epic",
            "is_default",
            "is_active",
            "level",
            "external_source",
            "external_id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
            "workspace",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
        ]


class IssueTypeLiteSerializer(BaseSerializer):
    """
    Lightweight issue type serializer for minimal data transfer.

    Provides essential issue type information optimized for
    UI display in dropdowns and lists.
    """

    class Meta:
        model = IssueType
        fields = ["id", "name", "description", "logo_props", "is_default", "is_active", "level"]


class ProjectIssueTypeSerializer(BaseSerializer):
    """
    Serializer for project-level issue type associations.

    Manages the relationship between projects and issue types,
    including project-specific settings like default type and ordering.
    """

    issue_type = IssueTypeLiteSerializer(read_only=True)
    issue_type_id = serializers.PrimaryKeyRelatedField(
        source="issue_type",
        queryset=IssueType.objects.all(),
        required=True,
        write_only=True,
    )

    def validate(self, data):
        # If the default is being provided then make all other types default False
        if data.get("is_default", False):
            ProjectIssueType.objects.filter(
                project_id=self.context.get("project_id")
            ).update(is_default=False)
        return data

    class Meta:
        model = ProjectIssueType
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "project",
            "workspace",
            "deleted_at",
        ]


class ProjectIssueTypeDetailSerializer(BaseSerializer):
    """
    Detailed serializer for project issue types with full issue type information.

    Includes complete issue type details for detailed views and management interfaces.
    """

    issue_type = IssueTypeSerializer(read_only=True)

    class Meta:
        model = ProjectIssueType
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "project",
            "deleted_at",
        ]

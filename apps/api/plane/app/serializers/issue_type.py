# Module imports
from .base import BaseSerializer
from plane.db.models import IssueType, ProjectIssueType


class IssueTypeSerializer(BaseSerializer):
    """Serializer for IssueType model."""

    class Meta:
        model = IssueType
        fields = [
            "id",
            "workspace_id",
            "name",
            "description",
            "logo_props",
            "is_default",
            "is_active",
            "is_system",
            "level",
        ]
        read_only_fields = ["workspace", "is_system"]


class IssueTypeLiteSerializer(BaseSerializer):
    """Lite serializer for IssueType model."""

    class Meta:
        model = IssueType
        fields = ["id", "name", "logo_props", "is_default"]
        read_only_fields = fields


class ProjectIssueTypeSerializer(BaseSerializer):
    """Serializer for ProjectIssueType model."""

    issue_type_detail = IssueTypeSerializer(source="issue_type", read_only=True)

    class Meta:
        model = ProjectIssueType
        fields = [
            "id",
            "project",
            "issue_type",
            "issue_type_detail",
            "level",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["project", "created_at", "updated_at"]

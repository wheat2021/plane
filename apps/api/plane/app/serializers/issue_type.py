# Module imports
from .base import BaseSerializer
from plane.db.models import IssueType


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
            "level",
        ]
        read_only_fields = ["workspace"]


class IssueTypeLiteSerializer(BaseSerializer):
    """Lite serializer for IssueType model."""

    class Meta:
        model = IssueType
        fields = ["id", "name", "logo_props", "is_default"]
        read_only_fields = fields

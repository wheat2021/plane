# Third Party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import ExtraPropertyConfig, IssueTypeExtraProperty


class ExtraPropertyConfigSerializer(BaseSerializer):
    """Serializer for ExtraPropertyConfig model with flattened config fields."""

    # Flattened config fields for easier API consumption
    options = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        help_text="Options for select/multiselect types",
    )
    default_value = serializers.JSONField(
        required=False,
        allow_null=True,
        help_text="Default value for the property",
    )
    true_value = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Display text for true value (checkbox type)",
    )
    false_value = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Display text for false value (checkbox type)",
    )

    class Meta:
        model = ExtraPropertyConfig
        fields = [
            "id",
            "workspace",
            "key",
            "label",
            "type",
            "description",
            "sort_order",
            # Flattened config fields
            "options",
            "default_value",
            "true_value",
            "false_value",
            # Audit fields
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def to_representation(self, instance):
        """Flatten config fields in the output."""
        data = super().to_representation(instance)
        # Extract config values
        config = instance.config or {}
        data["options"] = config.get("options", [])
        data["default_value"] = config.get("default_value")
        data["true_value"] = config.get("true_value", "Yes")
        data["false_value"] = config.get("false_value", "No")
        return data

    def to_internal_value(self, data):
        """Pack flattened fields into config before validation."""
        internal_data = super().to_internal_value(data)

        # Build config from flattened fields
        config = {}
        if "options" in data:
            config["options"] = data["options"]
        if "default_value" in data:
            config["default_value"] = data["default_value"]
        if "true_value" in data:
            config["true_value"] = data["true_value"]
        if "false_value" in data:
            config["false_value"] = data["false_value"]

        # Merge with existing config if updating
        if self.instance:
            existing_config = self.instance.config or {}
            existing_config.update(config)
            config = existing_config

        internal_data["config"] = config

        # Remove flattened fields as they're now in config
        internal_data.pop("options", None)
        internal_data.pop("default_value", None)
        internal_data.pop("true_value", None)
        internal_data.pop("false_value", None)

        return internal_data

    def validate_key(self, value):
        """Validate key is alphanumeric with underscores."""
        import re

        if not re.match(r"^[a-zA-Z][a-zA-Z0-9_]*$", value):
            raise serializers.ValidationError(
                "Key must start with a letter and contain only letters, numbers, and underscores."
            )
        return value

    def validate(self, attrs):
        """Validate type-specific configuration."""
        prop_type = attrs.get("type") or (self.instance.type if self.instance else None)
        config = attrs.get("config", {})

        # Validate options for select/multiselect types
        if prop_type in ("select", "multiselect"):
            options = config.get("options", [])
            if not options:
                raise serializers.ValidationError(
                    {"options": "Options are required for select/multiselect types."}
                )
            # Validate each option has a value
            for i, option in enumerate(options):
                if not isinstance(option, dict) or "value" not in option:
                    raise serializers.ValidationError(
                        {"options": f"Option at index {i} must have a 'value' field."}
                    )

        return attrs

    def create(self, validated_data):
        """Create ExtraPropertyConfig with workspace from context."""
        validated_data["workspace_id"] = self.context.get("workspace_id")
        return super().create(validated_data)


class ExtraPropertyConfigLiteSerializer(BaseSerializer):
    """Lightweight serializer for listing extra property configs."""

    class Meta:
        model = ExtraPropertyConfig
        fields = [
            "id",
            "key",
            "label",
            "type",
            "sort_order",
        ]
        read_only_fields = fields


class IssueTypeExtraPropertySerializer(BaseSerializer):
    """Serializer for IssueTypeExtraProperty model with nested config detail."""

    extra_property_config_detail = ExtraPropertyConfigSerializer(
        source="extra_property_config",
        read_only=True,
    )

    class Meta:
        model = IssueTypeExtraProperty
        fields = [
            "id",
            "project",
            "issue_type",
            "extra_property_config",
            "extra_property_config_detail",
            "sort_order",
            "is_required",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "project",
            "issue_type",
            "extra_property_config_detail",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        """Create IssueTypeExtraProperty with project and issue_type from context."""
        validated_data["project_id"] = self.context.get("project_id")
        validated_data["issue_type_id"] = self.context.get("issue_type_id")
        return super().create(validated_data)

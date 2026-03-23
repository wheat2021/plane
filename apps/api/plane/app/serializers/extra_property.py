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

    true_extra_input = serializers.DictField(
        required=False,
        allow_null=True,
        help_text="Extra input config for checkbox true state",
    )
    false_extra_input = serializers.DictField(
        required=False,
        allow_null=True,
        help_text="Extra input config for checkbox false state",
    )
    true_icon = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Lucide icon name for checkbox true state",
    )
    true_icon_color = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Hex color for checkbox true state icon",
    )
    false_icon = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Lucide icon name for checkbox false state",
    )
    false_icon_color = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Hex color for checkbox false state icon",
    )
    member_color = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Hex color for member type avatar border",
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
            "true_extra_input",
            "false_extra_input",
            "true_icon",
            "true_icon_color",
            "false_icon",
            "false_icon_color",
            "member_color",
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
        config = instance.config or {}
        data["options"] = config.get("options", [])
        data["default_value"] = config.get("default_value")
        data["true_value"] = config.get("true_value", "Yes")
        data["false_value"] = config.get("false_value", "No")
        data["true_extra_input"] = config.get("true_extra_input")
        data["false_extra_input"] = config.get("false_extra_input")
        data["true_icon"] = config.get("true_icon")
        data["true_icon_color"] = config.get("true_icon_color")
        data["false_icon"] = config.get("false_icon")
        data["false_icon_color"] = config.get("false_icon_color")
        data["member_color"] = config.get("member_color")
        return data

    def to_internal_value(self, data):
        """Pack flattened fields into config before validation."""
        internal_data = super().to_internal_value(data)

        config = {}
        if "options" in data:
            config["options"] = data["options"]
        if "default_value" in data:
            config["default_value"] = data["default_value"]
        if "true_value" in data:
            config["true_value"] = data["true_value"]
        if "false_value" in data:
            config["false_value"] = data["false_value"]
        if "true_extra_input" in data:
            config["true_extra_input"] = data["true_extra_input"]
        if "false_extra_input" in data:
            config["false_extra_input"] = data["false_extra_input"]
        if "true_icon" in data:
            config["true_icon"] = data["true_icon"]
        if "true_icon_color" in data:
            config["true_icon_color"] = data["true_icon_color"]
        if "false_icon" in data:
            config["false_icon"] = data["false_icon"]
        if "false_icon_color" in data:
            config["false_icon_color"] = data["false_icon_color"]
        if "member_color" in data:
            config["member_color"] = data["member_color"]

        if self.instance:
            existing_config = self.instance.config or {}
            existing_config.update(config)
            config = existing_config

        internal_data["config"] = config

        internal_data.pop("options", None)
        internal_data.pop("default_value", None)
        internal_data.pop("true_value", None)
        internal_data.pop("false_value", None)
        internal_data.pop("true_icon", None)
        internal_data.pop("true_icon_color", None)
        internal_data.pop("false_icon", None)
        internal_data.pop("false_icon_color", None)
        internal_data.pop("member_color", None)

        return internal_data

    def validate_key(self, value):
        """Validate key is alphanumeric with underscores."""
        import re

        if not re.match(r"^[a-zA-Z][a-zA-Z0-9_]*$", value):
            raise serializers.ValidationError(
                "Key must start with a letter and contain only letters, numbers, and underscores."
            )
        return value

    def _validate_extra_input_ref(self, ref, field_name, workspace_id):
        """Validate an extra_input reference dict."""
        if ref is None:
            return
        if not isinstance(ref, dict) or "config" not in ref:
            raise serializers.ValidationError(
                {field_name: "extra_input must have a 'config' field."}
            )
        config_id = ref["config"]
        if not ExtraPropertyConfig.objects.filter(
            id=config_id, workspace_id=workspace_id
        ).exists():
            raise serializers.ValidationError(
                {field_name: f"Referenced config {config_id} does not exist in this workspace."}
            )

    def validate(self, attrs):
        """Validate type-specific configuration."""
        prop_type = attrs.get("type") or (self.instance.type if self.instance else None)
        config = attrs.get("config", {})
        workspace_id = self.context.get("workspace_id") or (
            self.instance.workspace_id if self.instance else None
        )

        # Validate options for select/multiselect types
        if prop_type in ("select", "multiselect"):
            options = config.get("options", [])
            if not options:
                raise serializers.ValidationError(
                    {"options": "Options are required for select/multiselect types."}
                )
            for i, option in enumerate(options):
                if not isinstance(option, dict) or "value" not in option:
                    raise serializers.ValidationError(
                        {"options": f"Option at index {i} must have a 'value' field."}
                    )
                if workspace_id and option.get("extra_input"):
                    self._validate_extra_input_ref(
                        option["extra_input"], f"options[{i}].extra_input", workspace_id
                    )

        # Validate checkbox extra_input references
        if prop_type == "checkbox" and workspace_id:
            for field in ("true_extra_input", "false_extra_input"):
                ref = config.get(field)
                if ref:
                    self._validate_extra_input_ref(ref, field, workspace_id)

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
            "condition_config",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "project",
            "issue_type",
            "extra_property_config_detail",
            "condition_config",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        """Create IssueTypeExtraProperty with project and issue_type from context."""
        validated_data["project_id"] = self.context.get("project_id")
        validated_data["issue_type_id"] = self.context.get("issue_type_id")
        return super().create(validated_data)

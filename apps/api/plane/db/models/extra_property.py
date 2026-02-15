# Django imports
from django.db import models
from django.db.models import Q

# Module imports
from .base import BaseModel


class ExtraPropertyConfig(BaseModel):
    """
    Stores the configuration for extra properties at workspace level.
    Properties are defined once per workspace and can be bound to
    issue types via IssueTypeExtraProperty model.
    """

    TYPE_CHOICES = (
        ("text", "Text"),
        ("textarea", "Textarea"),
        ("select", "Select"),
        ("multiselect", "Multi-Select"),
        ("checkbox", "Checkbox"),
        ("markdown", "Markdown"),
    )

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="extra_property_configs",
    )

    key = models.CharField(max_length=100, help_text="Unique identifier for the property within a workspace")
    label = models.CharField(max_length=255, help_text="Display name for the property")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, help_text="Type of input control")
    description = models.TextField(blank=True, default="", help_text="Optional description/help text")
    sort_order = models.FloatField(default=65535, help_text="Order of the property in the form")

    # JSON config for type-specific settings
    # For select/multiselect: options array [{value, label?, isDefault?}]
    # For checkbox: true_value, false_value
    # For any type: default_value
    config = models.JSONField(default=dict, blank=True, help_text="Type-specific configuration")

    class Meta:
        verbose_name = "Extra Property Config"
        verbose_name_plural = "Extra Property Configs"
        db_table = "extra_property_configs"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "key"],
                condition=Q(deleted_at__isnull=True),
                name="extra_property_config_unique_workspace_key_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.workspace.name} - {self.label}"

    @property
    def options(self):
        """Get options for select/multiselect types."""
        return self.config.get("options", [])

    @property
    def default_value(self):
        """Get default value for the property."""
        return self.config.get("default_value")

    @property
    def true_value(self):
        """Get true value display for checkbox type."""
        return self.config.get("true_value", "Yes")

    @property
    def false_value(self):
        """Get false value display for checkbox type."""
        return self.config.get("false_value", "No")


class IssueTypeExtraProperty(BaseModel):
    """
    Binds an ExtraPropertyConfig to a specific IssueType within a Project.
    This allows different projects to enable different properties for the same issue type.
    """

    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="issue_type_extra_properties",
    )
    issue_type = models.ForeignKey(
        "db.IssueType",
        on_delete=models.CASCADE,
        related_name="extra_property_bindings",
    )
    extra_property_config = models.ForeignKey(
        "db.ExtraPropertyConfig",
        on_delete=models.CASCADE,
        related_name="issue_type_bindings",
    )
    sort_order = models.FloatField(default=65535, help_text="Order of the property within the issue type")
    is_required = models.BooleanField(default=False, help_text="Whether this property is required for issues of this type")

    class Meta:
        verbose_name = "Issue Type Extra Property"
        verbose_name_plural = "Issue Type Extra Properties"
        db_table = "issue_type_extra_properties"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["project", "issue_type", "extra_property_config"],
                condition=Q(deleted_at__isnull=True),
                name="issue_type_extra_property_unique_binding_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.project.name} - {self.issue_type.name} - {self.extra_property_config.label}"

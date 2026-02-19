import re

from django.db.models import Q

from plane.db.models import ExtraPropertyConfig, IssueTypeExtraProperty
from plane.utils.filters.filter_backend import ComplexFilterBackend

# Pattern to match extra_property_<configId>__<operator> keys
EXTRA_PROPERTY_PATTERN = re.compile(r"^extra_property_([a-f0-9\-]+)__(\w+)$")


class IssueComplexFilterBackend(ComplexFilterBackend):
    """
    Extended filter backend that handles extra property filters.

    Recognizes keys like `extra_property_<configId>__in` and converts them
    to JSON field lookups on Issue.extra_properties.
    """

    def _transform_field_name_for_validation(self, field_name):
        """Skip validation for extra_property_* keys (they are dynamic)."""
        if field_name.startswith("extra_property_"):
            return None
        return field_name

    def _extract_field_names(self, filter_data):
        """Extract field names, excluding extra_property_* keys from validation."""
        if isinstance(filter_data, dict):
            fields = []
            for key, value in filter_data.items():
                if key.lower() in ("or", "and", "not"):
                    if key.lower() == "not":
                        if isinstance(value, dict):
                            fields.extend(self._extract_field_names(value))
                    else:
                        for item in value:
                            fields.extend(self._extract_field_names(item))
                else:
                    if key.startswith("extra_property_"):
                        continue
                    transformed_field = self._transform_field_name_for_validation(key)
                    if transformed_field is not None:
                        fields.append(transformed_field)
            return fields
        return []

    def _preprocess_leaf_conditions(self, leaf_conditions, view, queryset):
        """Remove extra_property_* keys from leaf conditions (handled in _build_leaf_q)."""
        return {k: v for k, v in leaf_conditions.items() if not k.startswith("extra_property_")}

    def _build_leaf_q(self, leaf_conditions, view, queryset):
        """Build Q object, handling extra property conditions separately."""
        # Extract extra property conditions
        extra_q = Q()
        has_extra = False
        for key, values in leaf_conditions.items():
            match = EXTRA_PROPERTY_PATTERN.match(key)
            if not match:
                continue
            has_extra = True
            config_id = match.group(1)
            operator = match.group(2)
            # Normalize values: frontend joins multi-values as comma-separated strings
            if isinstance(values, str) and values:
                values = [v.strip() for v in values.split(",") if v.strip()]
            if operator == "in" and isinstance(values, list) and values:
                try:
                    config = ExtraPropertyConfig.objects.get(id=config_id, deleted_at__isnull=True)
                except ExtraPropertyConfig.DoesNotExist:
                    continue
                config_key = config.key
                default_value = config.default_value

                # Only match issues whose type is bound to this config
                bound_type_ids = list(
                    IssueTypeExtraProperty.objects.filter(
                        extra_property_config_id=config_id,
                        deleted_at__isnull=True,
                    ).values_list("issue_type_id", flat=True)
                )
                type_bound_q = Q(type_id__in=bound_type_ids) if bound_type_ids else Q(pk__in=[])

                # Check if filter values include the default_value.
                # Issues without the key stored should match when filtering
                # by the default value (frontend displays default as fallback).
                filter_includes_default = default_value is not None and str(default_value) in values
                key_missing_q = ~Q(extra_properties__has_key=config_key) if filter_includes_default else Q(pk__in=[])

                key_exists_q = Q(extra_properties__has_key=config_key)
                if config.type == "multiselect":
                    value_q = Q()
                    for v in values:
                        value_q |= Q(**{f"extra_properties__{config_key}__contains": v})
                    extra_q &= type_bound_q & ((key_exists_q & value_q) | key_missing_q)
                else:
                    extra_q &= type_bound_q & ((key_exists_q & Q(**{f"extra_properties__{config_key}__in": values})) | key_missing_q)

        # Build standard Q from remaining conditions
        standard_q = super()._build_leaf_q(leaf_conditions, view, queryset)

        if has_extra:
            return (standard_q & extra_q) if standard_q else extra_q
        return standard_q

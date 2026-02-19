import re

from django.db.models import Q

from plane.db.models import ExtraPropertyConfig
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
            if operator == "in" and isinstance(values, list) and values:
                try:
                    config = ExtraPropertyConfig.objects.get(id=config_id, deleted_at__isnull=True)
                except ExtraPropertyConfig.DoesNotExist:
                    continue
                config_key = config.key
                # Ensure the key exists in extra_properties
                key_exists_q = Q(extra_properties__has_key=config_key)
                if config.type == "multiselect":
                    # For multiselect: match if stored array contains any of the filter values
                    value_q = Q()
                    for v in values:
                        value_q |= Q(**{f"extra_properties__{config_key}__contains": v})
                    extra_q &= key_exists_q & value_q
                else:
                    # For select: exact value match against the list
                    extra_q &= key_exists_q & Q(**{f"extra_properties__{config_key}__in": values})

        # Build standard Q from remaining conditions
        standard_q = super()._build_leaf_q(leaf_conditions, view, queryset)

        if has_extra:
            return (standard_q & extra_q) if standard_q else extra_q
        return standard_q

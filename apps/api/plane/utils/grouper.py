# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import Case, CharField, Q, UUIDField, Value, When, QuerySet, OuterRef, Subquery
from django.db.models.fields.json import KeyTextTransform
from django.db.models.functions import Coalesce

# Module imports
from plane.db.models import (
    Cycle,
    ExtraPropertyConfig,
    Issue,
    IssueTypeExtraProperty,
    Label,
    Module,
    Project,
    ProjectMember,
    State,
    WorkspaceMember,
    IssueAssignee,
    ModuleIssue,
    IssueLabel,
)
from typing import Optional, Dict, Tuple, Any, Union, List

# Sentinel value for issues whose type does not support the extra property
EP_NONE_UNSUPPORTED = "__none_unsupported__"
EP_PREFIX = "extra_property:"
EP_ANNOTATION_PREFIX = "ep__"


def ep_annotation_name(group_by: str) -> str:
    """Convert 'extra_property:severity' → 'ep__severity' (valid Django annotation name)."""
    return EP_ANNOTATION_PREFIX + group_by[len(EP_PREFIX) :]


def issue_queryset_grouper(
    queryset: QuerySet[Issue],
    group_by: Optional[str],
    sub_group_by: Optional[str],
    project_id: Optional[str] = None,
) -> QuerySet[Issue]:
    FIELD_MAPPER: Dict[str, str] = {
        "label_ids": "labels__id",
        "assignee_ids": "assignees__id",
        "module_ids": "issue_module__module_id",
    }

    GROUP_FILTER_MAPPER: Dict[str, Q] = {
        "assignees__id": Q(issue_assignee__deleted_at__isnull=True),
        "labels__id": Q(label_issue__deleted_at__isnull=True),
        "issue_module__module_id": Q(issue_module__deleted_at__isnull=True),
    }

    for group_key in [group_by, sub_group_by]:
        if group_key in GROUP_FILTER_MAPPER:
            queryset = queryset.filter(GROUP_FILTER_MAPPER[group_key])

    issue_assignee_subquery = Subquery(
        IssueAssignee.objects.filter(
            issue_id=OuterRef("pk"),
            deleted_at__isnull=True,
        )
        .values("issue_id")
        .annotate(arr=ArrayAgg("assignee_id", distinct=True))
        .values("arr")
    )

    issue_module_subquery = Subquery(
        ModuleIssue.objects.filter(
            issue_id=OuterRef("pk"),
            deleted_at__isnull=True,
            module__archived_at__isnull=True,
        )
        .values("issue_id")
        .annotate(arr=ArrayAgg("module_id", distinct=True))
        .values("arr")
    )

    issue_label_subquery = Subquery(
        IssueLabel.objects.filter(issue_id=OuterRef("pk"), deleted_at__isnull=True)
        .values("issue_id")
        .annotate(arr=ArrayAgg("label_id", distinct=True))
        .values("arr")
    )

    annotations_map: Dict[str, Tuple[str, Q]] = {
        "assignee_ids": Coalesce(issue_assignee_subquery, Value([], output_field=ArrayField(UUIDField()))),
        "label_ids": Coalesce(issue_label_subquery, Value([], output_field=ArrayField(UUIDField()))),
        "module_ids": Coalesce(issue_module_subquery, Value([], output_field=ArrayField(UUIDField()))),
    }

    default_annotations: Dict[str, Any] = {}

    for key, expression in annotations_map.items():
        if FIELD_MAPPER.get(key) in {group_by, sub_group_by}:
            continue
        default_annotations[key] = expression

    # Handle extra_property:* grouping via JSONB annotation
    for gk in [group_by, sub_group_by]:
        if gk and gk.startswith(EP_PREFIX):
            prop_key = gk[len(EP_PREFIX) :]
            annotation_name = ep_annotation_name(gk)

            if project_id:
                # Determine which issue type IDs in this project support this property
                supported_type_ids = list(
                    IssueTypeExtraProperty.objects.filter(
                        project_id=project_id,
                        extra_property_config__key=prop_key,
                        deleted_at__isnull=True,
                    ).values_list("issue_type_id", flat=True)
                )
                # Annotate with two-None distinction:
                # - type not supported → EP_NONE_UNSUPPORTED
                # - supported but no value → "None"
                # - supported with value → the actual value
                default_annotations[annotation_name] = Case(
                    When(
                        ~Q(type_id__in=supported_type_ids),
                        then=Value(EP_NONE_UNSUPPORTED),
                    ),
                    default=Coalesce(
                        KeyTextTransform(prop_key, "extra_properties"),
                        Value("None"),
                    ),
                    output_field=CharField(),
                )
            else:
                # Workspace-level view: no project context, use single None
                default_annotations[annotation_name] = Coalesce(
                    KeyTextTransform(prop_key, "extra_properties"),
                    Value("None"),
                )

    return queryset.annotate(**default_annotations)


def issue_on_results(
    issues: QuerySet[Issue],
    group_by: Optional[str],
    sub_group_by: Optional[str],
) -> List[Dict[str, Any]]:
    FIELD_MAPPER: Dict[str, str] = {
        "labels__id": "label_ids",
        "assignees__id": "assignee_ids",
        "issue_module__module_id": "module_ids",
    }

    original_list: List[str] = ["assignee_ids", "label_ids", "module_ids"]

    required_fields: List[str] = [
        "id",
        "name",
        "state_id",
        "sort_order",
        "completed_at",
        "estimate_point",
        "priority",
        "start_date",
        "target_date",
        "sequence_id",
        "project_id",
        "parent_id",
        "type_id",
        "cycle_id",
        "sub_issues_count",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
        "attachment_count",
        "link_count",
        "is_draft",
        "archived_at",
        "state__group",
        "extra_properties",
    ]

    if group_by in FIELD_MAPPER:
        original_list.remove(FIELD_MAPPER[group_by])
        original_list.append(group_by)

    if sub_group_by in FIELD_MAPPER:
        original_list.remove(FIELD_MAPPER[sub_group_by])
        original_list.append(sub_group_by)

    # Include ep__ annotation fields so the paginator can bucket issues by group.
    # These fields are retained in the result dicts so that GroupedOffsetPaginator.process_results
    # can read them when partitioning issues into groups. They are harmless extra fields on the
    # final response and the frontend ignores them.
    for gk in [group_by, sub_group_by]:
        if gk and gk.startswith(EP_PREFIX):
            required_fields.append(ep_annotation_name(gk))

    required_fields.extend(original_list)
    return list(issues.values(*required_fields))


def issue_group_values(
    field: str,
    slug: str,
    project_id: Optional[str] = None,
    filters: Dict[str, Any] = {},
    queryset: Optional[QuerySet] = None,
) -> List[Union[str, Any]]:
    if field == "state_id":
        queryset = State.objects.filter(is_triage=False, workspace__slug=slug).values_list("id", flat=True)
        if project_id:
            return list(queryset.filter(project_id=project_id))
        return list(queryset)

    if field == "labels__id":
        queryset = Label.objects.filter(workspace__slug=slug).values_list("id", flat=True)
        if project_id:
            return list(queryset.filter(project_id=project_id)) + ["None"]
        return list(queryset) + ["None"]

    if field == "assignees__id":
        if project_id:
            return list(
                ProjectMember.objects.filter(workspace__slug=slug, project_id=project_id, is_active=True).values_list(
                    "member_id", flat=True
                )
            )
        return list(
            WorkspaceMember.objects.filter(workspace__slug=slug, is_active=True).values_list("member_id", flat=True)
        )

    if field == "issue_module__module_id":
        queryset = Module.objects.filter(workspace__slug=slug).values_list("id", flat=True)
        if project_id:
            return list(queryset.filter(project_id=project_id)) + ["None"]
        return list(queryset) + ["None"]

    if field == "cycle_id":
        queryset = Cycle.objects.filter(workspace__slug=slug).values_list("id", flat=True)
        if project_id:
            return list(queryset.filter(project_id=project_id)) + ["None"]
        return list(queryset) + ["None"]

    if field == "project_id":
        queryset = Project.objects.filter(workspace__slug=slug).values_list("id", flat=True)
        return list(queryset)

    if field == "priority":
        return ["low", "medium", "high", "urgent", "none"]

    if field == "state__group":
        return ["backlog", "unstarted", "started", "completed", "cancelled"]

    if field == "target_date":
        queryset = queryset.values_list("target_date", flat=True).distinct()
        if project_id:
            return list(queryset.filter(project_id=project_id))
        else:
            return list(queryset)

    if field == "start_date":
        queryset = queryset.values_list("start_date", flat=True).distinct()
        if project_id:
            return list(queryset.filter(project_id=project_id))
        else:
            return list(queryset)

    if field == "created_by":
        queryset = queryset.values_list("created_by", flat=True).distinct()
        if project_id:
            return list(queryset.filter(project_id=project_id))
        else:
            return list(queryset)

    # Handle extra_property:* grouping fields
    if field and field.startswith(EP_PREFIX):
        prop_key = field[len(EP_PREFIX) :]
        try:
            config = ExtraPropertyConfig.objects.get(
                workspace__slug=slug,
                key=prop_key,
                deleted_at__isnull=True,
            )
            options = config.config.get("options", [])
            option_values = [opt["value"] for opt in options if "value" in opt]
            return option_values + ["None", EP_NONE_UNSUPPORTED]
        except ExtraPropertyConfig.DoesNotExist:
            return ["None", EP_NONE_UNSUPPORTED]

    return []

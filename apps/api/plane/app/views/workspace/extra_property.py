# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.app.views.base import BaseAPIView
from plane.app.serializers import ExtraPropertyConfigSerializer
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import ExtraPropertyConfig, IssueTypeExtraProperty, Issue, Workspace


def _extract_extra_input_targets(config_obj):
    """Extract all extra_input config IDs from a config's options/checkbox fields."""
    cfg = config_obj.config or {}
    targets = set()
    for opt in cfg.get("options", []):
        ei = opt.get("extra_input")
        if ei and ei.get("config"):
            targets.add(str(ei["config"]))
    for field in ("true_extra_input", "false_extra_input"):
        ei = cfg.get(field)
        if ei and ei.get("config"):
            targets.add(str(ei["config"]))
    return targets


def _detect_cycle(workspace_id, updated_config_id=None, updated_targets=None):
    """Build directed graph of extra_input refs and DFS for cycles.
    Returns cycle path list if found, else None."""
    configs = ExtraPropertyConfig.objects.filter(workspace_id=workspace_id)
    graph = {}
    for c in configs:
        cid = str(c.id)
        if cid == str(updated_config_id):
            graph[cid] = updated_targets or set()
        else:
            graph[cid] = _extract_extra_input_targets(c)
    if updated_config_id and str(updated_config_id) not in graph:
        graph[str(updated_config_id)] = updated_targets or set()

    WHITE, GRAY, BLACK = 0, 1, 2
    color = {n: WHITE for n in graph}
    path = []

    def dfs(node):
        color[node] = GRAY
        path.append(node)
        for nb in graph.get(node, set()):
            if nb not in color:
                continue
            if color[nb] == GRAY:
                cycle_start = path.index(nb)
                return path[cycle_start:] + [nb]
            if color[nb] == WHITE:
                result = dfs(nb)
                if result:
                    return result
        path.pop()
        color[node] = BLACK
        return None

    for node in list(graph.keys()):
        if color.get(node) == WHITE:
            result = dfs(node)
            if result:
                return result
    return None


def _get_extra_input_config_ids(config_obj):
    """Get set of (config_id, required) tuples from a config's extra_input refs."""
    cfg = config_obj.config or {}
    result = {}  # config_id -> required
    for opt in cfg.get("options", []):
        ei = opt.get("extra_input")
        if ei and ei.get("config"):
            cid = str(ei["config"])
            # If any ref says required=True, keep True
            result[cid] = result.get(cid, False) or bool(ei.get("required", False))
    for field in ("true_extra_input", "false_extra_input"):
        ei = cfg.get(field)
        if ei and ei.get("config"):
            cid = str(ei["config"])
            result[cid] = result.get(cid, False) or bool(ei.get("required", False))
    return result


def _create_condition_bindings_for_config(parent_config, project_id, issue_type_id, parent_sort_order, visited=None):
    """Recursively create condition bindings for a config's extra_input references."""
    if visited is None:
        visited = set()
    if str(parent_config.id) in visited:
        return
    visited.add(str(parent_config.id))

    refs = _get_extra_input_config_ids(parent_config)
    offset = 0.5
    for child_config_id, required in refs.items():
        # Skip if binding already exists
        if IssueTypeExtraProperty.objects.filter(
            project_id=project_id,
            issue_type_id=issue_type_id,
            extra_property_config_id=child_config_id,
        ).exists():
            continue
        child_sort = parent_sort_order + offset
        offset += 0.25
        binding = IssueTypeExtraProperty.objects.create(
            project_id=project_id,
            issue_type_id=issue_type_id,
            extra_property_config_id=child_config_id,
            condition_config=parent_config,
            is_required=required,
            sort_order=child_sort,
        )
        # Recurse for nested extra_input
        try:
            child_config = ExtraPropertyConfig.objects.get(id=child_config_id)
            _create_condition_bindings_for_config(
                child_config, project_id, issue_type_id, child_sort, visited
            )
        except ExtraPropertyConfig.DoesNotExist:
            pass


def _delete_condition_bindings_cascade(config_id, project_id, issue_type_id):
    """Recursively delete condition bindings triggered by config_id."""
    cond_bindings = IssueTypeExtraProperty.objects.filter(
        project_id=project_id,
        issue_type_id=issue_type_id,
        condition_config_id=config_id,
    )
    for cb in cond_bindings:
        # Recurse: this binding's config may also be a parent
        _delete_condition_bindings_cascade(
            cb.extra_property_config_id, project_id, issue_type_id
        )
        cb.delete()


def _sync_condition_bindings_on_config_update(config, old_config_data):
    """Sync condition bindings across all project+issueType when config's extra_input changes."""
    class _Tmp:
        pass
    old_tmp = _Tmp()
    old_tmp.config = old_config_data
    old_refs = set(_get_extra_input_config_ids(old_tmp).keys())
    new_refs_dict = _get_extra_input_config_ids(config)
    new_refs = set(new_refs_dict.keys())

    added = new_refs - old_refs
    removed = old_refs - new_refs
    common = new_refs & old_refs

    if not added and not removed and not common:
        return

    # Find all project+issueType combos that have this config bound
    parent_bindings = IssueTypeExtraProperty.objects.filter(
        extra_property_config=config,
    )

    for pb in parent_bindings:
        pid, itid = pb.project_id, pb.issue_type_id

        # Create bindings for added refs
        for child_config_id in added:
            if not IssueTypeExtraProperty.objects.filter(
                project_id=pid, issue_type_id=itid, extra_property_config_id=child_config_id,
            ).exists():
                IssueTypeExtraProperty.objects.create(
                    project_id=pid,
                    issue_type_id=itid,
                    extra_property_config_id=child_config_id,
                    condition_config=config,
                    is_required=new_refs_dict.get(child_config_id, False),
                    sort_order=pb.sort_order + 0.5,
                )

        # Delete bindings for removed refs
        for child_config_id in removed:
            _delete_condition_bindings_cascade(child_config_id, pid, itid)
            IssueTypeExtraProperty.objects.filter(
                project_id=pid,
                issue_type_id=itid,
                extra_property_config_id=child_config_id,
                condition_config=config,
            ).delete()

        # Update is_required for common refs
        old_refs_dict = _get_extra_input_config_ids(old_tmp)
        for child_config_id in common:
            new_req = new_refs_dict.get(child_config_id, False)
            old_req = old_refs_dict.get(child_config_id, False)
            if new_req != old_req:
                IssueTypeExtraProperty.objects.filter(
                    project_id=pid,
                    issue_type_id=itid,
                    extra_property_config_id=child_config_id,
                    condition_config=config,
                ).update(is_required=new_req)


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
            # Check for cycles before saving
            new_config_data = serializer.validated_data.get("config", config.config or {})
            # Build a temporary config object to extract targets
            class _Tmp:
                pass
            tmp = _Tmp()
            tmp.config = new_config_data
            new_targets = _extract_extra_input_targets(tmp)
            if new_targets:
                cycle = _detect_cycle(config.workspace_id, str(config.id), new_targets)
                if cycle:
                    labels = []
                    for cid in cycle:
                        try:
                            labels.append(ExtraPropertyConfig.objects.get(id=cid).label)
                        except ExtraPropertyConfig.DoesNotExist:
                            labels.append(cid)
                    return Response(
                        {"error": f"Circular reference detected: {' → '.join(labels)}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            old_config = config.config or {}
            serializer.save()

            # Sync condition bindings after save
            _sync_condition_bindings_on_config_update(config, old_config)

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


class ExtraPropertyConfigValuesEndpoint(BaseAPIView):
    """
    GET /api/workspaces/{slug}/extra-properties/{pk}/values/
    Returns usage stats: count of issues using this property and distinct values.
    """

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug, pk):
        try:
            config = ExtraPropertyConfig.objects.get(id=pk, workspace__slug=slug)
        except ExtraPropertyConfig.DoesNotExist:
            return Response({"error": "Extra property config not found"}, status=status.HTTP_404_NOT_FOUND)

        issues = Issue.objects.filter(
            workspace__slug=slug,
            extra_properties__has_key=config.key,
        )
        count = issues.count()
        distinct_values = sorted(
            {
                str(v)
                for v in issues.values_list(f"extra_properties__{config.key}", flat=True)
                if v is not None
            }
        )
        return Response({"count": count, "distinct_values": distinct_values}, status=status.HTTP_200_OK)

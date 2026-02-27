"""
Django Admin configuration for employee account management.

Provides:
- EmployeeUserAdmin: list/search/edit employee accounts with org fields
- Deactivate accounts action
- CSV bulk import action (with intermediate upload form)
- Assign workspace action (with intermediate slug form)
"""

import csv
import io

from django import forms
from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin
from django.shortcuts import redirect, render
from django.urls import path

from plane.db.models import User, Workspace, WorkspaceMember


# ---------------------------------------------------------------------------
# Custom forms for intermediate action pages
# ---------------------------------------------------------------------------


class CsvImportForm(forms.Form):
    csv_file = forms.FileField(
        label="CSV 文件",
        help_text="列顺序：employee_id, email, display_name, department, team, workspace（首行为 header）",
    )


class AssignWorkspaceForm(forms.Form):
    workspace_slug = forms.CharField(
        label="Workspace Slug",
        max_length=255,
        help_text="目标 Workspace 的 slug，例如 my-workspace",
    )


# ---------------------------------------------------------------------------
# EmployeeUserAdmin
# ---------------------------------------------------------------------------


class EmployeeUserAdmin(admin.ModelAdmin):
    # List view
    list_display = (
        "employee_id",
        "email",
        "display_name",
        "department",
        "team",
        "is_active",
        "date_joined",
    )
    list_filter = ("is_active", "is_bot")
    search_fields = ("employee_id", "email", "display_name")
    ordering = ("-date_joined",)
    readonly_fields = (
        "id",
        "username",
        "date_joined",
        "last_login_time",
        "last_active",
    )

    # Edit form field layout
    fieldsets = (
        (
            "账号信息",
            {
                "fields": (
                    "email",
                    "display_name",
                    "first_name",
                    "last_name",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                )
            },
        ),
        (
            "组织信息",
            {
                "fields": (
                    "employee_id",
                    "department",
                    "team",
                )
            },
        ),
        (
            "只读字段",
            {
                "classes": ("collapse",),
                "fields": (
                    "id",
                    "username",
                    "date_joined",
                    "last_login_time",
                    "last_active",
                ),
            },
        ),
    )

    actions = ["deactivate_accounts", "import_csv_action", "assign_workspace_action"]

    # ------------------------------------------------------------------
    # Custom admin URLs (for intermediate pages)
    # ------------------------------------------------------------------

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "import-csv/",
                self.admin_site.admin_view(self.import_csv_view),
                name="db_user_import_csv",
            ),
            path(
                "assign-workspace/",
                self.admin_site.admin_view(self.assign_workspace_view),
                name="db_user_assign_workspace",
            ),
        ]
        return custom_urls + urls

    # ------------------------------------------------------------------
    # Action: deactivate selected accounts
    # ------------------------------------------------------------------

    @admin.action(description="停用选中账号（设 is_active=False）")
    def deactivate_accounts(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"已停用 {updated} 个账号。", messages.SUCCESS)

    # ------------------------------------------------------------------
    # Action: redirect to CSV import page
    # ------------------------------------------------------------------

    @admin.action(description="批量导入 CSV（跳转到上传页面）")
    def import_csv_action(self, request, queryset):
        return redirect("admin:db_user_import_csv")

    # ------------------------------------------------------------------
    # View: CSV import
    # ------------------------------------------------------------------

    def import_csv_view(self, request):
        if request.method == "POST":
            form = CsvImportForm(request.POST, request.FILES)
            if form.is_valid():
                result = self._process_csv(request.FILES["csv_file"])
                self.message_user(
                    request,
                    f"导入完成：成功 {result['success']} 条，跳过 {result['skipped']} 条，"
                    f"错误 {result['errors']} 条。"
                    + (f" 详情：{'; '.join(result['error_details'])}" if result["error_details"] else ""),
                    messages.SUCCESS if result["errors"] == 0 else messages.WARNING,
                )
                return redirect("admin:db_user_changelist")
        else:
            form = CsvImportForm()

        context = {
            **self.admin_site.each_context(request),
            "form": form,
            "title": "批量导入员工账号（CSV）",
            "opts": self.model._meta,
        }
        return render(request, "admin/db/user/import_csv.html", context)

    def _process_csv(self, file_obj: "InMemoryUploadedFile") -> dict:
        """Parse CSV and create user accounts. Returns result summary."""
        success = 0
        skipped = 0
        errors = 0
        error_details = []

        text = file_obj.read().decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))

        required_columns = {"employee_id", "email", "display_name"}
        if not required_columns.issubset(set(reader.fieldnames or [])):
            return {
                "success": 0,
                "skipped": 0,
                "errors": 1,
                "error_details": [f"CSV 缺少必填列，需要：{required_columns}"],
            }

        for lineno, row in enumerate(reader, start=2):
            employee_id = (row.get("employee_id") or "").strip()
            email = (row.get("email") or "").strip().lower()
            display_name = (row.get("display_name") or "").strip()
            department = (row.get("department") or "").strip()
            team = (row.get("team") or "").strip()
            workspace_slug = (row.get("workspace") or "").strip()

            if not employee_id or not email or not display_name:
                errors += 1
                error_details.append(f"第 {lineno} 行：employee_id/email/display_name 不能为空")
                continue

            # Duplicate check
            if User.objects.filter(employee_id=employee_id).exists():
                skipped += 1
                error_details.append(f"第 {lineno} 行：工号 {employee_id} 已存在，跳过")
                continue
            if User.objects.filter(email=email).exists():
                skipped += 1
                error_details.append(f"第 {lineno} 行：邮箱 {email} 已存在，跳过")
                continue

            import uuid

            try:
                user = User.objects.create(
                    username=uuid.uuid4().hex,
                    email=email,
                    display_name=display_name,
                    employee_id=employee_id,
                    department=department or None,
                    team=team or None,
                    is_active=True,
                    is_password_autoset=True,
                    is_password_reset_required=True,
                )
                user.set_password(employee_id)
                user.save(update_fields=["password"])

                # Optional workspace assignment
                if workspace_slug:
                    workspace = Workspace.objects.filter(slug=workspace_slug).first()
                    if workspace:
                        WorkspaceMember.objects.get_or_create(
                            workspace=workspace,
                            member=user,
                            defaults={"role": 15},
                        )
                    else:
                        error_details.append(
                            f"第 {lineno} 行（{email}）：Workspace '{workspace_slug}' 不存在，已跳过分配"
                        )

                success += 1
            except Exception as exc:
                errors += 1
                error_details.append(f"第 {lineno} 行：创建失败 — {exc}")

        return {
            "success": success,
            "skipped": skipped,
            "errors": errors,
            "error_details": error_details,
        }

    # ------------------------------------------------------------------
    # Action: redirect to workspace assignment page
    # ------------------------------------------------------------------

    @admin.action(description="分配到 Workspace（跳转到确认页面）")
    def assign_workspace_action(self, request, queryset):
        # Store selected IDs in session
        request.session["assign_workspace_user_ids"] = list(queryset.values_list("id", flat=True).order_by())
        return redirect("admin:db_user_assign_workspace")

    # ------------------------------------------------------------------
    # View: workspace assignment
    # ------------------------------------------------------------------

    def assign_workspace_view(self, request):
        user_ids = request.session.get("assign_workspace_user_ids", [])
        users = User.objects.filter(id__in=user_ids)

        if request.method == "POST":
            form = AssignWorkspaceForm(request.POST)
            if form.is_valid():
                slug = form.cleaned_data["workspace_slug"].strip()
                workspace = Workspace.objects.filter(slug=slug).first()
                if not workspace:
                    form.add_error("workspace_slug", f"找不到 slug 为 '{slug}' 的 Workspace")
                else:
                    assigned = 0
                    skipped = 0
                    for user in users:
                        _, created = WorkspaceMember.objects.get_or_create(
                            workspace=workspace,
                            member=user,
                            defaults={"role": 15},
                        )
                        if created:
                            assigned += 1
                        else:
                            skipped += 1
                    self.message_user(
                        request,
                        f"分配完成：新增 {assigned} 个成员，已是成员跳过 {skipped} 个。",
                        messages.SUCCESS,
                    )
                    request.session.pop("assign_workspace_user_ids", None)
                    return redirect("admin:db_user_changelist")
        else:
            form = AssignWorkspaceForm()

        context = {
            **self.admin_site.each_context(request),
            "form": form,
            "users": users,
            "title": "批量分配 Workspace",
            "opts": self.model._meta,
        }
        return render(request, "admin/db/user/assign_workspace.html", context)


admin.site.register(User, EmployeeUserAdmin)

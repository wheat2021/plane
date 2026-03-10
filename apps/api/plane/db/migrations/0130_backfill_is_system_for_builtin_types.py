# Generated manually

from django.db import migrations

SYSTEM_TYPE_NAMES = ["Task", "Bug", "Story", "Requirement", "Milestone", "Report"]


def backfill_is_system(apps, schema_editor):
    """Mark built-in issue types as is_system=True."""
    IssueType = apps.get_model("db", "IssueType")
    IssueType.objects.filter(name__in=SYSTEM_TYPE_NAMES).update(is_system=True)


def reverse_backfill_is_system(apps, schema_editor):
    """Reverse: set is_system=False for built-in types."""
    IssueType = apps.get_model("db", "IssueType")
    IssueType.objects.filter(name__in=SYSTEM_TYPE_NAMES).update(is_system=False)


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0129_add_is_system_to_issue_type"),
    ]

    operations = [
        migrations.RunPython(
            backfill_is_system,
            reverse_code=reverse_backfill_is_system,
        ),
    ]

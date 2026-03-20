# Generated manually for moving required field from ExtraPropertyConfig to IssueTypeExtraProperty

from django.db import migrations, models


def migrate_required_to_bindings(apps, schema_editor):
    """Copy ExtraPropertyConfig.required to all associated IssueTypeExtraProperty.is_required records."""
    ExtraPropertyConfig = apps.get_model('db', 'ExtraPropertyConfig')
    IssueTypeExtraProperty = apps.get_model('db', 'IssueTypeExtraProperty')

    for config in ExtraPropertyConfig.objects.filter(required=True, deleted_at__isnull=True):
        IssueTypeExtraProperty.objects.filter(
            extra_property_config=config,
            deleted_at__isnull=True
        ).update(is_required=True)


def reverse_migrate_required(apps, schema_editor):
    """Reverse migration: copy is_required back to ExtraPropertyConfig.required."""
    ExtraPropertyConfig = apps.get_model('db', 'ExtraPropertyConfig')
    IssueTypeExtraProperty = apps.get_model('db', 'IssueTypeExtraProperty')

    for config in ExtraPropertyConfig.objects.filter(deleted_at__isnull=True):
        has_required_binding = IssueTypeExtraProperty.objects.filter(
            extra_property_config=config,
            is_required=True,
            deleted_at__isnull=True
        ).exists()
        if has_required_binding:
            config.required = True
            config.save(update_fields=['required'])


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0122_extra_property_workspace_scope'),
    ]

    operations = [
        # Step 1: Add is_required field to IssueTypeExtraProperty
        migrations.AddField(
            model_name='issuetypeextraproperty',
            name='is_required',
            field=models.BooleanField(default=False, help_text='Whether this property is required for issues of this type'),
        ),
        # Step 2: Migrate data from ExtraPropertyConfig.required to IssueTypeExtraProperty.is_required
        migrations.RunPython(migrate_required_to_bindings, reverse_migrate_required),
        # Step 3: Remove required field from ExtraPropertyConfig
        migrations.RemoveField(
            model_name='extrapropertyconfig',
            name='required',
        ),
    ]

# Generated manually for extra property workspace scope refactor

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0121_add_extra_property_config_and_issue_extra_properties'),
    ]

    operations = [
        # Remove old unique constraint
        migrations.RemoveConstraint(
            model_name='extrapropertyconfig',
            name='extra_property_config_unique_issue_type_key_when_deleted_at_null',
        ),
        # Remove old unique_together
        migrations.AlterUniqueTogether(
            name='extrapropertyconfig',
            unique_together=set(),
        ),
        # Remove issue_type FK from ExtraPropertyConfig
        migrations.RemoveField(
            model_name='extrapropertyconfig',
            name='issue_type',
        ),
        # Add new unique constraint for workspace + key
        migrations.AddConstraint(
            model_name='extrapropertyconfig',
            constraint=models.UniqueConstraint(
                condition=models.Q(('deleted_at__isnull', True)),
                fields=('workspace', 'key'),
                name='extra_property_config_unique_workspace_key_when_deleted_at_null',
            ),
        ),
        # Create IssueTypeExtraProperty model for project-level bindings
        migrations.CreateModel(
            name='IssueTypeExtraProperty',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('sort_order', models.FloatField(default=65535, help_text='Order of the property within the issue type')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='issue_type_extra_properties', to='db.project')),
                ('issue_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='extra_property_bindings', to='db.issuetype')),
                ('extra_property_config', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='issue_type_bindings', to='db.extrapropertyconfig')),
            ],
            options={
                'verbose_name': 'Issue Type Extra Property',
                'verbose_name_plural': 'Issue Type Extra Properties',
                'db_table': 'issue_type_extra_properties',
                'ordering': ('sort_order', 'created_at'),
            },
        ),
        migrations.AddConstraint(
            model_name='issuetypeextraproperty',
            constraint=models.UniqueConstraint(
                condition=models.Q(('deleted_at__isnull', True)),
                fields=('project', 'issue_type', 'extra_property_config'),
                name='issue_type_extra_property_unique_binding_when_deleted_at_null',
            ),
        ),
    ]

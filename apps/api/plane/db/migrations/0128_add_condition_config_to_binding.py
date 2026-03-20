# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0127_add_milestone_report_issue_types"),
    ]

    operations = [
        migrations.AddField(
            model_name="issuetypeextraproperty",
            name="condition_config",
            field=models.ForeignKey(
                blank=True,
                help_text="Parent config that triggers this condition binding; null for normal bindings",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="condition_bindings",
                to="db.extrapropertyconfig",
            ),
        ),
    ]

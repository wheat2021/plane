# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0130_backfill_is_system_for_builtin_types"),
    ]

    operations = [
        migrations.AlterField(
            model_name="extrapropertyconfig",
            name="type",
            field=models.CharField(
                choices=[
                    ("text", "Text"),
                    ("textarea", "Textarea"),
                    ("select", "Select"),
                    ("multiselect", "Multi-Select"),
                    ("checkbox", "Checkbox"),
                    ("markdown", "Markdown"),
                    ("member", "Member"),
                ],
                help_text="Type of input control",
                max_length=20,
            ),
        ),
    ]

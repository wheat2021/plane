# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0131_add_member_type_to_extra_property"),
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
                    ("reference", "Reference"),
                ],
                help_text="Type of input control",
                max_length=20,
            ),
        ),
    ]

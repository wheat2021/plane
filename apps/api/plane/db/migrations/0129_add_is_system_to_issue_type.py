# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0128_add_condition_config_to_binding"),
    ]

    operations = [
        migrations.AddField(
            model_name="issuetype",
            name="is_system",
            field=models.BooleanField(default=False),
        ),
    ]

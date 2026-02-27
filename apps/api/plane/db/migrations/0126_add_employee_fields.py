from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0125_add_extra_display_properties_to_issue_view"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="employee_id",
            field=models.CharField(blank=True, db_index=True, max_length=6, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="user",
            name="department",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="team",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]

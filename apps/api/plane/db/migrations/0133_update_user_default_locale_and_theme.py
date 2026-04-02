# Generated manually

import pytz
from django.db import migrations, models

import plane.db.models.user


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0132_add_reference_type_to_extra_property"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="user_timezone",
            field=models.CharField(
                choices=tuple(zip(pytz.common_timezones, pytz.common_timezones)),
                default="Asia/Shanghai",
                max_length=255,
            ),
        ),
        migrations.AlterField(
            model_name="profile",
            name="language",
            field=models.CharField(default="zh-CN", max_length=255),
        ),
        migrations.AlterField(
            model_name="profile",
            name="theme",
            field=models.JSONField(default=plane.db.models.user.get_default_theme),
        ),
    ]

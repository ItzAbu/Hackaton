from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="eu_math_science",
            field=models.PositiveSmallIntegerField(
                default=0,
                help_text="0-5 — Competenza matematica e base in scienze/tecnologie",
            ),
        ),
        migrations.AddField(
            model_name="profile",
            name="eu_digital",
            field=models.PositiveSmallIntegerField(
                default=0,
                help_text="0-5 — Competenza digitale",
            ),
        ),
        migrations.AddField(
            model_name="profile",
            name="eu_personal_social_learning",
            field=models.PositiveSmallIntegerField(
                default=0,
                help_text="0-5 — Competenza personale/sociale e imparare ad imparare",
            ),
        ),
    ]

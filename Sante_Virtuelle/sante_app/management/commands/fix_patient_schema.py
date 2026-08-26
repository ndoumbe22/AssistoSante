from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Fix the Patient table schema to match the current model'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Add the adresse column to the Patient table if it doesn't exist
            try:
                cursor.execute('ALTER TABLE "Patient" ADD COLUMN "adresse" text;')
                self.stdout.write(
                    self.style.SUCCESS('Successfully added adresse column to Patient table')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'Column might already exist or error occurred: {e}')
                )
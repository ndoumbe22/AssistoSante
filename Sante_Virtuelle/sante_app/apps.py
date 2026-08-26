from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class SanteAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'sante_app'

    def ready(self):
        # Import here to avoid AppRegistryNotReady exception
        from .scheduler import scheduler
        from . import signals  # Import signals to register them
        
        # Start the scheduler
        try:
            scheduler.start()
            logger.info("Scheduler started successfully with medication and appointment reminders")
        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}")

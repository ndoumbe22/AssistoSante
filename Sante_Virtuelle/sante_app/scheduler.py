from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from datetime import datetime, time, timedelta
from .models import RappelMedicament, HistoriquePriseMedicament, RendezVous
from .notifications import NotificationService
import logging

logger = logging.getLogger(__name__)

class MedicationReminderScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        
    def start(self):
        """Start the scheduler"""
        # Schedule the medication reminder check to run every minute
        self.scheduler.add_job(
            self.check_medication_reminders,
            CronTrigger(minute="*"),  # Run every minute
            id="medication_reminder_check",
            name="Check medication reminders",
            replace_existing=True,
        )
        
        # Schedule the appointment reminder check to run every hour
        self.scheduler.add_job(
            self.check_appointment_reminders,
            CronTrigger(minute=0),  # Run every hour
            id="appointment_reminder_check",
            name="Check appointment reminders",
            replace_existing=True,
        )
        
        self.scheduler.start()
        logger.info("Scheduler started with medication and appointment reminders")
        
    def stop(self):
        """Stop the scheduler"""
        self.scheduler.shutdown()
        logger.info("Scheduler stopped")
        
    def check_medication_reminders(self):
        """Check for medication reminders that need to be sent"""
        try:
            # Get current time
            now = timezone.now()
            current_time = now.time()
            
            # Get all active medication reminders for today
            reminders = RappelMedicament.objects.filter(
                actif=True,
                date_debut__lte=now.date()
            ).exclude(
                date_fin__lt=now.date()
            )
            
            for reminder in reminders:
                # Check if it's time to send the reminder
                if self._should_send_reminder(reminder, current_time):
                    self._send_medication_reminder(reminder)
                    
        except Exception as e:
            logger.error(f"Error checking medication reminders: {e}")
            
    def check_appointment_reminders(self):
        """Check for appointment reminders that need to be sent"""
        try:
            # Get current time
            now = timezone.now()
            
            # Get appointments for tomorrow
            tomorrow = now.date() + timedelta(days=1)
            appointments = RendezVous.objects.filter(
                date=tomorrow,
                statut="CONFIRMED"
            )
            
            for appointment in appointments:
                # Send reminder to patient
                self._send_appointment_reminder(appointment)
                    
        except Exception as e:
            logger.error(f"Error checking appointment reminders: {e}")
            
    def _should_send_reminder(self, reminder, current_time):
        """Check if it's time to send a reminder"""
        # For simplicity, we'll check if the current time is within a 1-minute window
        # of the reminder time
        reminder_time = reminder.heure_rappel
        
        # Calculate time difference in minutes
        current_minutes = current_time.hour * 60 + current_time.minute
        reminder_minutes = reminder_time.hour * 60 + reminder_time.minute
        
        # Handle case where time difference crosses midnight
        time_diff = abs(current_minutes - reminder_minutes)
        
        # If the difference is more than 12 hours, it means we've crossed midnight
        # In that case, we need to calculate the shortest distance
        if time_diff > 720:  # 12 hours in minutes
            time_diff = 1440 - time_diff  # 24 hours - time_diff
        
        # Send reminder if within 1 minute of scheduled time
        return time_diff <= 1
        
    def _send_medication_reminder(self, reminder):
        """Send medication reminder notification"""
        try:
            # Check if we've already sent a reminder today
            today = timezone.now().date()
            existing_reminder = HistoriquePriseMedicament.objects.filter(
                rappel=reminder,
                date_prise__date=today
            ).first()
            
            # If we haven't sent a reminder today, send one
            if not existing_reminder:
                # Create a record in the history
                history_entry = HistoriquePriseMedicament.objects.create(
                    rappel=reminder,
                    prise_effectuee=False,
                    notes="Rappel envoyé"
                )
                
                # Send email notification using NotificationService
                patient = reminder.patient
                if patient.user.email:
                    NotificationService.send_medication_reminder(
                        patient,
                        reminder.medicament,
                        reminder.dosage,
                        reminder.heure_rappel
                    )
                        
        except Exception as e:
            logger.error(f"Error sending medication reminder: {e}")
            
    def _send_appointment_reminder(self, appointment):
        """Send appointment reminder notification"""
        try:
            # Check if we've already sent a reminder for this appointment
            # In a real implementation, you might want to store this in a separate model
            # For now, we'll just send the reminder
            
            # Send email notification using NotificationService
            patient = appointment.patient
            medecin = appointment.medecin
            
            if patient.email:
                # Create subject and message for appointment reminder
                subject = f"📅 Rappel de rendez-vous - Demain à {appointment.heure.strftime('%H:%M')}"
                message = f"""
Bonjour {patient.first_name},

Ceci est un rappel pour votre rendez-vous médical demain :

📅 Date : {appointment.date.strftime('%d/%m/%Y')}
⏰ Heure : {appointment.heure.strftime('%H:%M')}
👨‍⚕️ Médecin : Dr. {medecin.first_name} {medecin.last_name}

Merci d'arriver 10 minutes avant l'heure prévue.

Cordialement,
L'équipe AssitoSanté
                """
                
                try:
                    send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL,
                        [patient.email],
                        fail_silently=False,
                    )
                    logger.info(f"✅ Appointment reminder sent to {patient.email}")
                except Exception as e:
                    logger.error(f"❌ Error sending appointment reminder: {e}")
                        
        except Exception as e:
            logger.error(f"Error processing appointment reminder: {e}")

# Global scheduler instance
scheduler = MedicationReminderScheduler()

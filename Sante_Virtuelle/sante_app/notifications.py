from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from datetime import datetime, timedelta

class NotificationService:
    """Service de notifications par email (gratuit)"""

    @staticmethod
    def send_appointment_request_notification(rendez_vous):
        """Envoyer notification de demande de rendez-vous au médecin"""
        patient = rendez_vous.patient
        medecin = rendez_vous.medecin

        # Additional validation to ensure we're only sending to one specific doctor
        if not medecin or not hasattr(medecin, 'email') or not getattr(medecin, 'email', None):
            print(f"❌ Erreur: Médecin invalide ou email manquant pour le rendez-vous {getattr(rendez_vous, 'numero', 'N/A')}")
            return

        # Handle date formatting
        if isinstance(rendez_vous.date, str):
            try:
                from datetime import datetime
                date_obj = datetime.strptime(rendez_vous.date, '%Y-%m-%d')
                date_formatted = date_obj.strftime('%d/%m/%Y')
            except:
                date_formatted = rendez_vous.date
        else:
            date_formatted = rendez_vous.date.strftime('%d/%m/%Y')

        # Handle time formatting
        if isinstance(rendez_vous.heure, str):
            try:
                from datetime import datetime
                # Handle different time formats
                if len(rendez_vous.heure) == 8 and rendez_vous.heure[2] == ':' and rendez_vous.heure[5] == ':':  # HH:MM:SS
                    time_obj = datetime.strptime(rendez_vous.heure, '%H:%M:%S')
                else:  # HH:MM
                    time_obj = datetime.strptime(rendez_vous.heure, '%H:%M')
                time_formatted = time_obj.strftime('%H:%M')
            except:
                time_formatted = rendez_vous.heure
        else:
            time_formatted = rendez_vous.heure.strftime('%H:%M')

        subject = f"📅 Nouvelle demande de rendez-vous - AssitoSanté"
        message = f"""
Bonjour Dr. {medecin.first_name},

Vous avez reçu une nouvelle demande de rendez-vous :

👤 Patient : {patient.first_name} {patient.last_name}
📅 Date : {date_formatted}
⏰ Heure : {time_formatted}
📝 Description : {rendez_vous.description}

Veuillez vous connecter à votre espace médecin pour confirmer ou refuser cette demande.

Cordialement,
L'équipe AssitoSanté
        """

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [medecin.email],
                fail_silently=False,
            )
            print(f"✅ Notification de demande de rendez-vous envoyée à {medecin.email}")
        except Exception as e:
            print(f"❌ Erreur lors de l'envoi de la notification : {e}")

    @staticmethod
    def send_appointment_confirmation(rendez_vous):
        """Envoyer confirmation de rendez-vous"""
        patient = rendez_vous.patient
        medecin = rendez_vous.medecin

        # Handle date formatting
        if isinstance(rendez_vous.date, str):
            try:
                from datetime import datetime
                date_obj = datetime.strptime(rendez_vous.date, '%Y-%m-%d')
                date_formatted = date_obj.strftime('%d/%m/%Y')
            except:
                date_formatted = rendez_vous.date
        else:
            date_formatted = rendez_vous.date.strftime('%d/%m/%Y')

        # Handle time formatting
        if isinstance(rendez_vous.heure, str):
            try:
                from datetime import datetime
                # Handle different time formats
                if len(rendez_vous.heure) == 8 and rendez_vous.heure[2] == ':' and rendez_vous.heure[5] == ':':  # HH:MM:SS
                    time_obj = datetime.strptime(rendez_vous.heure, '%H:%M:%S')
                else:  # HH:MM
                    time_obj = datetime.strptime(rendez_vous.heure, '%H:%M')
                time_formatted = time_obj.strftime('%H:%M')
            except:
                time_formatted = rendez_vous.heure
        else:
            time_formatted = rendez_vous.heure.strftime('%H:%M')

        subject = f"✅ Rendez-vous confirmé - AssitoSanté"
        message = f"""
Bonjour {patient.first_name},

Votre rendez-vous a été confirmé :

📅 Date : {date_formatted}
⏰ Heure : {time_formatted}
👨‍⚕️ Médecin : Dr. {medecin.first_name} {medecin.last_name}
📍 Lieu : À déterminer

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
            print(f"✅ Email de confirmation envoyé à {patient.email}")
        except Exception as e:
            print(f"❌ Erreur lors de l'envoi de l'email : {e}")

    @staticmethod
    def send_appointment_cancellation(rendez_vous):
        """Envoyer annulation de rendez-vous"""
        patient = rendez_vous.patient
        medecin = rendez_vous.medecin

        # Handle date formatting
        if isinstance(rendez_vous.date, str):
            try:
                from datetime import datetime
                date_obj = datetime.strptime(rendez_vous.date, '%Y-%m-%d')
                date_formatted = date_obj.strftime('%d/%m/%Y')
            except:
                date_formatted = rendez_vous.date
        else:
            date_formatted = rendez_vous.date.strftime('%d/%m/%Y')

        # Handle time formatting
        if isinstance(rendez_vous.heure, str):
            try:
                from datetime import datetime
                # Handle different time formats
                if len(rendez_vous.heure) == 8 and rendez_vous.heure[2] == ':' and rendez_vous.heure[5] == ':':  # HH:MM:SS
                    time_obj = datetime.strptime(rendez_vous.heure, '%H:%M:%S')
                else:  # HH:MM
                    time_obj = datetime.strptime(rendez_vous.heure, '%H:%M')
                time_formatted = time_obj.strftime('%H:%M')
            except:
                time_formatted = rendez_vous.heure
        else:
            time_formatted = rendez_vous.heure.strftime('%H:%M')

        subject = f"❌ Rendez-vous annulé - AssitoSanté"
        message = f"""
Bonjour {patient.first_name},

Votre rendez-vous du {date_formatted} à {time_formatted} avec Dr. {medecin.first_name} {medecin.last_name} a été annulé.

Veuillez nous contacter pour reprogrammer un nouveau rendez-vous.

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
            print(f"✅ Email d'annulation envoyé à {patient.email}")
        except Exception as e:
            print(f"❌ Erreur lors de l'envoi de l'email : {e}")

    @staticmethod
    def send_appointment_reschedule(rendez_vous, old_date, old_time):
        """Envoyer reprogrammation de rendez-vous"""
        patient = rendez_vous.patient
        medecin = rendez_vous.medecin

        # Handle date formatting for old_date (could be string or date object)
        if isinstance(old_date, str):
            try:
                # Try to parse the string as a date
                from datetime import datetime
                old_date_obj = datetime.strptime(old_date, '%Y-%m-%d')
                old_date_formatted = old_date_obj.strftime('%d/%m/%Y')
            except:
                # If parsing fails, use the string as is
                old_date_formatted = old_date
        else:
            # Assume it's a date object
            old_date_formatted = old_date.strftime('%d/%m/%Y')

        # Handle time formatting for old_time (could be string or time object)
        if isinstance(old_time, str):
            try:
                # Try to parse the string as a time
                from datetime import datetime
                # Handle different time formats
                if len(old_time) == 8 and old_time[2] == ':' and old_time[5] == ':':  # HH:MM:SS
                    old_time_obj = datetime.strptime(old_time, '%H:%M:%S')
                else:  # HH:MM
                    old_time_obj = datetime.strptime(old_time, '%H:%M')
                old_time_formatted = old_time_obj.strftime('%H:%M')
            except:
                # If parsing fails, use the string as is
                old_time_formatted = old_time
        else:
            # Assume it's a time object
            old_time_formatted = old_time.strftime('%H:%M')

        # Handle date formatting for new date
        if isinstance(rendez_vous.date, str):
            try:
                # Try to parse the string as a date
                from datetime import datetime
                new_date_obj = datetime.strptime(rendez_vous.date, '%Y-%m-%d')
                new_date_formatted = new_date_obj.strftime('%d/%m/%Y')
            except:
                # If parsing fails, use the string as is
                new_date_formatted = rendez_vous.date
        else:
            # Assume it's a date object
            new_date_formatted = rendez_vous.date.strftime('%d/%m/%Y')

        # Handle time formatting for new time
        if isinstance(rendez_vous.heure, str):
            try:
                # Try to parse the string as a time
                from datetime import datetime
                # Handle different time formats
                if len(rendez_vous.heure) == 8 and rendez_vous.heure[2] == ':' and rendez_vous.heure[5] == ':':  # HH:MM:SS
                    new_time_obj = datetime.strptime(rendez_vous.heure, '%H:%M:%S')
                else:  # HH:MM
                    new_time_obj = datetime.strptime(rendez_vous.heure, '%H:%M')
                new_time_formatted = new_time_obj.strftime('%H:%M')
            except:
                # If parsing fails, use the string as is
                new_time_formatted = rendez_vous.heure
        else:
            # Assume it's a time object
            new_time_formatted = rendez_vous.heure.strftime('%H:%M')

        subject = f"📅 Rendez-vous reprogrammé - AssitoSanté"
        message = f"""
Bonjour {patient.first_name},

Votre rendez-vous a été reprogrammé :

📅 Ancienne date : {old_date_formatted} à {old_time_formatted}
📅 Nouvelle date : {new_date_formatted} à {new_time_formatted}
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
            print(f"✅ Email de reprogrammation envoyé à {patient.email}")
        except Exception as e:
            print(f"❌ Erreur lors de l'envoi de l'email : {e}")

    @staticmethod
    def send_welcome_email(user):
        """Envoyer email de bienvenue"""
        subject = f"🎉 Bienvenue sur AssitoSanté"
        message = f"""
Bonjour {user.first_name},

Bienvenue sur AssitoSanté ! Votre compte a été créé avec succès.

Vous pouvez maintenant :
- Prendre des rendez-vous médicaux
- Consulter votre historique médical
- Recevoir des rappels de médicaments
- Discuter avec notre assistant médical

Cordialement,
L'équipe AssitoSanté
        """

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            print(f"✅ Email de bienvenue envoyé à {user.email}")
        except Exception as e:
            print(f"❌ Erreur lors de l'envoi de l'email : {e}")

    @staticmethod
    def send_medication_reminder(patient, medicament, dosage, horaire):
        """Envoyer rappel de prise de médicament"""
        subject = f"💊 Rappel de prise de médicament - {medicament}"
        message = f"""
Bonjour {patient.first_name},

C'est l'heure de prendre votre médicament :

💊 Médicament : {medicament}
📏 Dosage : {dosage}
⏰ Heure : {horaire.strftime('%H:%M')}

Merci de bien vouloir prendre votre médicament comme prescrit.

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
            print(f"✅ Rappel de médicament envoyé à {patient.email}")
        except Exception as e:
            print(f"❌ Erreur lors de l'envoi du rappel de médicament : {e}")

    @staticmethod
    def send_document_shared_notification(document, recipient):
        """Envoyer notification de partage de document"""
        rendez_vous = document.rendez_vous
        sender = document.uploaded_by

        subject = f"📁 Nouveau document médical partagé - AssitoSanté"
        message = f"""
Bonjour {recipient.first_name},

{sender.first_name} {sender.last_name} a partagé un nouveau document médical :

📄 Type : {document.document_type}
📝 Description : {document.description}
📅 Rendez-vous : {rendez_vous.date.strftime('%d/%m/%Y')} à {rendez_vous.heure.strftime('%H:%M')}

Veuillez vous connecter à votre espace pour consulter le document.

Cordialement,
L'équipe AssitoSanté
        """

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [recipient.email],
                fail_silently=False,
            )
            print(f"✅ Notification de document partagé envoyée à {recipient.email}")
        except Exception as e:
            print(f"❌ Erreur lors de l'envoi de la notification de document : {e}")

    @staticmethod
    def send_urgence_confirmation(urgence):
        """Confirmer la réception de l'urgence au patient"""
        subject = "🚨 Urgence reçue - AssitoSanté"
        message = f"""
Bonjour {urgence.patient.user.first_name},

Votre signalement d'urgence a bien été reçu.

Type : {urgence.type_urgence}
Priorité : {urgence.get_priorite_display()}
Heure de signalement : {urgence.date_creation.strftime('%H:%M')}

Nos médecins ont été notifiés et vont vous contacter rapidement.

EN CAS D'URGENCE VITALE, COMPOSEZ LE 15 (SAMU) IMMÉDIATEMENT.

Équipe AssitoSanté
        """

        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [urgence.patient.user.email])
            return True
        except Exception as e:
            print(f"Erreur envoi email : {e}")
            return False

    @staticmethod
    def send_urgence_notification_medecin(urgence, medecin):
        """Notifier un médecin d'une urgence"""
        subject = f"🚨 URGENCE {urgence.get_priorite_display().upper()} - AssitoSanté"
        message = f"""
Dr. {medecin.user.first_name},

NOUVELLE URGENCE SIGNALÉE

Patient : {urgence.patient.user.first_name} {urgence.patient.user.last_name}
Type : {urgence.type_urgence}
Priorité : {urgence.get_priorite_display()}
Score : {urgence.score_urgence}/100

Symptômes : {urgence.symptomes[:200]}

Téléphone : {urgence.telephone_contact}
Heure : {urgence.date_creation.strftime('%H:%M')}

Connectez-vous pour prendre en charge cette urgence.

AssitoSanté
        """

        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [medecin.user.email])
            return True
        except Exception as e:
            print(f"Erreur envoi email médecin : {e}")
            return False

    @staticmethod
    def send_urgence_prise_en_charge(urgence):
        """Notifier le patient de la prise en charge"""
        subject = "✅ Urgence prise en charge"
        message = f"""
Bonjour {urgence.patient.user.first_name},

Votre urgence a été prise en charge par :

{urgence.medecin_nom}
Spécialité : {urgence.medecin_charge.specialite}

Le médecin va vous contacter sous peu au {urgence.telephone_contact}.

Équipe AssitoSanté
        """

        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [urgence.patient.user.email])
            return True
        except Exception as e:
            print(f"Erreur envoi email : {e}")
            return False

    @staticmethod
    def send_reschedule_request(rendez_vous):
        """Envoyer notification de demande de reprogrammation au médecin"""
        patient = rendez_vous.patient
        medecin = rendez_vous.medecin

        # Handle date formatting for original date
        if isinstance(rendez_vous.original_date, str):
            try:
                from datetime import datetime
                orig_date_obj = datetime.strptime(rendez_vous.original_date, '%Y-%m-%d')
                orig_date_formatted = orig_date_obj.strftime('%d/%m/%Y')
            except:
                orig_date_formatted = rendez_vous.original_date
        else:
            orig_date_formatted = rendez_vous.original_date.strftime('%d/%m/%Y') if rendez_vous.original_date else "N/A"

        # Handle time formatting for original time
        if isinstance(rendez_vous.original_heure, str):
            try:
                from datetime import datetime
                # Handle different time formats
                if len(rendez_vous.original_heure) == 8 and rendez_vous.original_heure[2] == ':' and rendez_vous.original_heure[5] == ':':  # HH:MM:SS
                    orig_time_obj = datetime.strptime(rendez_vous.original_heure, '%H:%M:%S')
                else:  # HH:MM
                    orig_time_obj = datetime.strptime(rendez_vous.original_heure, '%H:%M')
                orig_time_formatted = orig_time_obj.strftime('%H:%M')
            except:
                orig_time_formatted = rendez_vous.original_heure
        else:
            orig_time_formatted = rendez_vous.original_heure.strftime('%H:%M') if rendez_vous.original_heure else "N/A"

        # Handle date formatting for new date
        if isinstance(rendez_vous.date, str):
            try:
                from datetime import datetime
                new_date_obj = datetime.strptime(rendez_vous.date, '%Y-%m-%d')
                new_date_formatted = new_date_obj.strftime('%d/%m/%Y')
            except:
                new_date_formatted = rendez_vous.date
        else:
            new_date_formatted = rendez_vous.date.strftime('%d/%m/%Y')

        # Handle time formatting for new time
        if isinstance(rendez_vous.heure, str):
            try:
                from datetime import datetime
                # Handle different time formats
                if len(rendez_vous.heure) == 8 and rendez_vous.heure[2] == ':' and rendez_vous.heure[5] == ':':  # HH:MM:SS
                    new_time_obj = datetime.strptime(rendez_vous.heure, '%H:%M:%S')
                else:  # HH:MM
                    new_time_obj = datetime.strptime(rendez_vous.heure, '%H:%M')
                new_time_formatted = new_time_obj.strftime('%H:%M')
            except:
                new_time_formatted = rendez_vous.heure
        else:
            new_time_formatted = rendez_vous.heure.strftime('%H:%M')

        subject = f"📅 Demande de reprogrammation de rendez-vous - AssitoSanté"
        message = f"""
Bonjour Dr. {medecin.first_name},

Le patient {patient.first_name} {patient.last_name} a demandé à reprogrammer son rendez-vous :

📅 Date actuelle : {orig_date_formatted} à {orig_time_formatted}
📅 Nouvelle date demandée : {new_date_formatted} à {new_time_formatted}
📝 Raison : {rendez_vous.description}

Veuillez vous connecter à votre espace médecin pour accepter ou refuser cette demande.

Cordialement,
L'équipe AssitoSanté
        """

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [medecin.email],
                fail_silently=False,
            )
            print(f"✅ Notification de demande de reprogrammation envoyée à {medecin.email}")
        except Exception as e:
            print(f"❌ Erreur lors de l'envoi de la notification : {e}")

    @staticmethod
    def send_article_validated_notification(article):
        """Envoyer notification de validation d'article au médecin"""
        medecin = article.auteur
        subject = f"✅ Article validé - AssitoSanté"
        message = f"""
Bonjour Dr. {medecin.user.first_name},

Bonne nouvelle ! Votre article "{article.titre}" a été validé par l'administrateur et est maintenant publié.

Titre : {article.titre}
Date de validation : {article.date_validation.strftime('%d/%m/%Y %H:%M') if article.date_validation else 'N/A'}

Vous pouvez consulter votre article publié sur la plateforme.

Cordialement,
L'équipe AssitoSanté
        """

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [medecin.user.email],
                fail_silently=False,
            )
            print(f"✅ Notification de validation d'article envoyée à {medecin.user.email}")
        except Exception as e:
            print(f"❌ Erreur lors de l'envoi de la notification : {e}")

    @staticmethod
    def send_article_rejected_notification(article, reason=""):
        """Envoyer notification de refus d'article au médecin"""
        medecin = article.auteur
        subject = f"❌ Article refusé - AssitoSanté"
        message = f"""
Bonjour Dr. {medecin.user.first_name},

Malheureusement, votre article "{article.titre}" a été refusé par l'administrateur.

Titre : {article.titre}
Raison du refus : {reason if reason else 'Non spécifiée'}

Vous pouvez modifier votre article et le soumettre à nouveau pour validation.

Cordialement,
L'équipe AssitoSanté
        """

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [medecin.user.email],
                fail_silently=False,
            )
            print(f"✅ Notification de refus d'article envoyée à {medecin.user.email}")
        except Exception as e:
            print(f"❌ Erreur lors de l'envoi de la notification : {e}")

    @staticmethod
    def send_article_deactivated_notification(article):
        """Envoyer notification de désactivation d'article au médecin"""
        medecin = article.auteur
        subject = f"⚠️ Article désactivé - AssitoSanté"
        message = f"""
Bonjour Dr. {medecin.user.first_name},

Votre article "{article.titre}" a été désactivé par l'administrateur.

Titre : {article.titre}
Raison : {article.commentaire_moderation if article.commentaire_moderation else 'Non spécifiée'}

L'article n'est plus visible publiquement. Vous pouvez contacter l'administrateur pour plus d'informations.

Cordialement,
L'équipe AssitoSanté
        """

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [medecin.user.email],
                fail_silently=False,
            )
            print(f"✅ Notification de désactivation d'article envoyée à {medecin.user.email}")
        except Exception as e:
            print(f"❌ Erreur lors de l'envoi de la notification : {e}")

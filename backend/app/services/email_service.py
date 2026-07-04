import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("kamlesh.email")


def send_notification(subject: str, body: str) -> None:
    """Notify the shop of a new enquiry/survey/order.

    Sends a real email via SMTP when SMTP_* settings are configured; otherwise
    logs (so the app works fully with no email keys). Any send failure is
    swallowed and logged — a notification must never break the customer request.
    """
    if not settings.email_enabled:
        logger.info("EMAIL NOTIFICATION | %s | %s", subject, body)
        return

    recipient = settings.NOTIFY_EMAIL or settings.SMTP_USER
    try:
        msg = EmailMessage()
        msg["Subject"] = f"[Kamlesh Paints] {subject}"
        msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
        msg["To"] = recipient
        msg.set_content(body)
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Sent email notification to %s: %s", recipient, subject)
    except Exception as exc:  # noqa: BLE001 — never let notification failure break the request
        logger.warning("Email send failed (%s); notification: %s | %s", exc, subject, body)


def send_customer_email(to: str | None, subject: str, body: str) -> None:
    """Send a transactional email to a customer (order/invoice confirmation).
    Logs in dev when SMTP is not configured; failures never break the request."""
    if not to:
        return
    if not settings.email_enabled:
        logger.info("CUSTOMER EMAIL | to=%s | %s | %s", to, subject, body)
        return
    try:
        msg = EmailMessage()
        msg["Subject"] = f"Kamlesh Paints — {subject}"
        msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
        msg["To"] = to
        msg.set_content(body)
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Customer email failed (%s): %s | %s", exc, subject, body)

import logging

logger = logging.getLogger("kamlesh.email")


def send_notification(subject: str, body: str) -> None:
    """Email delivery stub — logs instead of sending. Swap in a real provider
    (SES, Resend, SMTP) before launch."""
    logger.info("EMAIL NOTIFICATION | %s | %s", subject, body)

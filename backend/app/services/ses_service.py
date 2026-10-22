import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class SESEmailService:
    def __init__(self):
        self.region = settings.AWS_REGION
        self.sender_email = settings.AWS_SES_SENDER_EMAIL
        self.ses_client = None

        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            try:
                self.ses_client = boto3.client(
                    "ses",
                    region_name=self.region,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                )
            except Exception as e:
                logger.warning(f"Could not initialize Boto3 SES client: {e}")
        else:
            try:
                self.ses_client = boto3.client("ses", region_name=self.region)
            except Exception:
                self.ses_client = None

    def send_reservation_ticket(
        self,
        recipient_email: str,
        driver_name: str,
        vehicle_number: str,
        lot_name: str,
        slot_number: str,
        start_time: str,
        end_time: str,
        total_amount: float,
        pass_url: str,
    ) -> bool:
        """
        Sends ParkCloud reservation confirmation and pass download link via AWS SES.
        Gracefully handles Free Tier sandbox restrictions.
        """
        subject = f"ParkCloud Confirmation: Slot {slot_number} at {lot_name}"
        
        body_html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FFF7ED; margin: 0; padding: 20px; }}
                .container {{ max-width: 580px; margin: auto; background: #ffffff; border-radius: 16px; border: 1px solid #FED7AA; overflow: hidden; }}
                .header {{ background-color: #EA580C; color: #ffffff; padding: 24px; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 24px; letter-spacing: -0.5px; }}
                .body-content {{ padding: 24px; color: #1E293B; }}
                .badge {{ display: inline-block; background-color: #DCFCE7; color: #15803D; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 12px; }}
                .card {{ background: #FFF7ED; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #FFEDD5; }}
                .field {{ margin-bottom: 10px; }}
                .field-label {{ color: #9A3412; font-size: 11px; text-transform: uppercase; font-weight: bold; }}
                .field-val {{ color: #0F172A; font-size: 15px; font-weight: 600; }}
                .btn {{ display: inline-block; background-color: #EA580C; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; margin-top: 15px; }}
                .footer {{ text-align: center; color: #94A3B8; font-size: 12px; padding: 16px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>ParkCloud Reservation Confirmed</h1>
                </div>
                <div class="body-content">
                    <p>Hello <strong>{driver_name}</strong>,</p>
                    <p>Your parking slot has been reserved successfully! <span class="badge">CONFIRMED</span></p>
                    
                    <div class="card">
                        <div class="field">
                            <div class="field-label">Parking Facility</div>
                            <div class="field-val">{lot_name}</div>
                        </div>
                        <div class="field">
                            <div class="field-label">Allotted Slot & Vehicle</div>
                            <div class="field-val">Slot {slot_number} &bull; {vehicle_number}</div>
                        </div>
                        <div class="field">
                            <div class="field-label">Reservation Schedule</div>
                            <div class="field-val">{start_time} to {end_time}</div>
                        </div>
                        <div class="field">
                            <div class="field-label">Amount Paid</div>
                            <div class="field-val">${total_amount:.2f} (Prepaid)</div>
                        </div>
                    </div>

                    <p style="text-align: center;">
                        <a href="{pass_url}" class="btn">View & Download Parking Pass PDF</a>
                    </p>
                    <p style="font-size: 13px; color: #64748B; text-align: center;">
                        Please display the QR code in your pass to the attendant upon entry.
                    </p>
                </div>
                <div class="footer">
                    &copy; ParkCloud Smart Parking System &bull; Powered by AWS Free Tier Architecture
                </div>
            </div>
        </body>
        </html>
        """

        if self.ses_client and self.sender_email:
            try:
                response = self.ses_client.send_email(
                    Source=self.sender_email,
                    Destination={"ToAddresses": [recipient_email]},
                    Message={
                        "Subject": {"Data": subject, "Charset": "UTF-8"},
                        "Body": {"Html": {"Data": body_html, "Charset": "UTF-8"}},
                    },
                )
                logger.info(f"AWS SES email sent successfully to {recipient_email}. MessageId: {response.get('MessageId')}")
                return True
            except (ClientError, NoCredentialsError) as e:
                logger.warning(f"AWS SES dispatch failed ({e}). Proceeding without email error.")
        else:
            logger.info(f"[Mock SES Dispatch] To: {recipient_email} | Subject: {subject} | Pass: {pass_url}")

        return False


ses_service = SESEmailService()

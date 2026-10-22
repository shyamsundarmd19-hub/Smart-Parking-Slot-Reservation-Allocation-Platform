import io
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from datetime import datetime


class QRPdfService:
    @staticmethod
    def generate_qr_image(payload: str) -> io.BytesIO:
        """Generate high-resolution QR code image in memory."""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=2,
        )
        qr.add_data(payload)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#1E293B", back_color="#FFFFFF")
        
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        return buffer

    @staticmethod
    def generate_parking_pass_pdf(
        reservation_id: str,
        pass_hash: str,
        driver_name: str,
        vehicle_number: str,
        lot_name: str,
        slot_number: str,
        slot_type: str,
        start_time: datetime,
        end_time: datetime,
        total_amount: float,
        transaction_id: str,
    ) -> bytes:
        """
        Generates a modern, branded ParkCloud PDF Parking Pass with QR verification code.
        Designed with Light Pale Orange / Peach Aesthetic (#F97316 & #FFF7ED).
        """
        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # Card Container Dimensions
        card_w = 420
        card_h = 560
        card_x = (width - card_w) / 2
        card_y = (height - card_h) / 2

        # 1. Background Fill & Soft Border
        pdf.setFillColor(colors.HexColor("#FFFFFF"))
        pdf.setStrokeColor(colors.HexColor("#FFEDD5"))  # orange-100
        pdf.setLineWidth(2)
        pdf.roundRect(card_x, card_y, card_w, card_h, 16, fill=1, stroke=1)

        # 2. Header Banner (Pale Orange / Peach)
        pdf.setFillColor(colors.HexColor("#FFF7ED"))  # orange-50
        pdf.roundRect(card_x, card_y + card_h - 100, card_w, 100, 16, fill=1, stroke=0)
        # Fix rounded corners bottom by drawing rectangle over lower part
        pdf.rect(card_x, card_y + card_h - 100, card_w, 20, fill=1, stroke=0)

        # 3. Brand Title & Tagline
        pdf.setFillColor(colors.HexColor("#EA580C"))  # primary orange-600
        pdf.setFont("Helvetica-Bold", 24)
        pdf.drawString(card_x + 24, card_y + card_h - 45, "ParkCloud")

        pdf.setFillColor(colors.HexColor("#9A3412"))  # orange-800
        pdf.setFont("Helvetica", 10)
        pdf.drawString(card_x + 24, card_y + card_h - 65, "SMART PARKING PASS & VERIFICATION TICKET")

        # Status Badge
        pdf.setFillColor(colors.HexColor("#22C55E"))  # green badge
        pdf.roundRect(card_x + card_w - 95, card_y + card_h - 52, 75, 22, 11, fill=1, stroke=0)
        pdf.setFillColor(colors.white)
        pdf.setFont("Helvetica-Bold", 9)
        pdf.drawCentredString(card_x + card_w - 57, card_y + card_h - 44, "CONFIRMED")

        # 4. QR Code Generation & Embedding
        qr_buffer = QRPdfService.generate_qr_image(pass_hash)
        qr_image = ImageReader(qr_buffer)
        qr_size = 140
        qr_x = card_x + (card_w - qr_size) / 2
        qr_y = card_y + card_h - 260
        pdf.drawImage(qr_image, qr_x, qr_y, width=qr_size, height=qr_size)

        pdf.setFillColor(colors.HexColor("#64748B"))
        pdf.setFont("Helvetica", 9)
        pdf.drawCentredString(card_x + card_w / 2, qr_y - 12, "Present this QR code to the lot attendant upon entry/exit")

        # 5. Divider Line
        pdf.setStrokeColor(colors.HexColor("#FED7AA"))  # orange-200
        pdf.setLineWidth(1)
        pdf.line(card_x + 20, qr_y - 25, card_x + card_w - 20, qr_y - 25)

        # 6. Details Grid
        details_y = qr_y - 50
        col1_x = card_x + 28
        col2_x = card_x + 225

        def draw_field(title: str, value: str, x: float, y: float):
            pdf.setFillColor(colors.HexColor("#94A3B8"))  # muted label
            pdf.setFont("Helvetica-Bold", 8)
            pdf.drawString(x, y, title.upper())
            pdf.setFillColor(colors.HexColor("#0F172A"))  # dark text
            pdf.setFont("Helvetica-Bold", 12)
            pdf.drawString(x, y - 16, value)

        draw_field("Driver Name", driver_name[:20], col1_x, details_y)
        draw_field("Vehicle Number", vehicle_number, col2_x, details_y)

        draw_field("Parking Lot", lot_name[:22], col1_x, details_y - 45)
        draw_field("Slot Allotment", f"{slot_number} ({slot_type.upper()})", col2_x, details_y - 45)

        start_str = start_time.strftime("%d %b %Y, %I:%M %p")
        end_str = end_time.strftime("%d %b %Y, %I:%M %p")
        draw_field("Valid From", start_str, col1_x, details_y - 90)
        draw_field("Valid Until", end_str, col2_x, details_y - 90)

        # 7. Payment Summary Banner
        banner_y = card_y + 20
        pdf.setFillColor(colors.HexColor("#FFF7ED"))
        pdf.roundRect(card_x + 16, banner_y, card_w - 32, 45, 8, fill=1, stroke=0)

        pdf.setFillColor(colors.HexColor("#C2410C"))
        pdf.setFont("Helvetica", 9)
        pdf.drawString(card_x + 28, banner_y + 26, f"Transaction Ref: {transaction_id}")
        pdf.drawString(card_x + 28, banner_y + 12, f"Reservation Ref: {reservation_id[:16]}...")

        pdf.setFillColor(colors.HexColor("#EA580C"))
        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawRightString(card_x + card_w - 28, banner_y + 18, f"${total_amount:.2f}")

        pdf.save()
        buffer.seek(0)
        return buffer.getvalue()


qr_pdf_service = QRPdfService()

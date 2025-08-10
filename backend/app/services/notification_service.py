# backend/app/services/notification_service.py

import qrcode
from fpdf import FPDF
from io import BytesIO
from typing import Dict, Any
import emails 
from emails.template import JinjaTemplate
from app.core.config import settings

# --- (Las funciones generate_qr_code_as_bytes, PDF, y generate_appointment_pdf_as_bytes no cambian) ---
def generate_qr_code_as_bytes(appointment_id: str) -> BytesIO:
    """Genera un código QR que apunta a una URL de verificación y lo devuelve como bytes."""
    verification_url = f"http://localhost:5173/verify-appointment/{appointment_id}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(verification_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = BytesIO()
    img.save(buffer, "PNG")
    buffer.seek(0)
    return buffer

class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        title = 'Confirmación de Cita - ServiBook'.encode('latin-1', 'replace').decode('latin-1')
        self.cell(0, 10, title, 0, 1, 'C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        page_num = f'Página {self.page_no()}'.encode('latin-1', 'replace').decode('latin-1')
        self.cell(0, 10, page_num, 0, 0, 'C')

def generate_appointment_pdf_as_bytes(details: Dict[str, Any]) -> bytes:
    """Genera un PDF de confirmación de cita y lo devuelve como bytes."""
    pdf = PDF()
    pdf.add_page()
    pdf.set_font('Arial', '', 12)
    
    user_name = details.get('user_name', 'Cliente').encode('latin-1', 'replace').decode('latin-1')
    business_name = details.get('business_name', 'N/A').encode('latin-1', 'replace').decode('latin-1')
    address = details.get('address', 'N/A').encode('latin-1', 'replace').decode('latin-1')
    footer_text = "Presenta este comprobante (o el código QR) en el establecimiento. ¡Gracias por usar ServiBook!".encode('latin-1', 'replace').decode('latin-1')

    pdf.cell(0, 10, f"Hola, {user_name}!", 0, 1)
    pdf.ln(5)
    pdf.multi_cell(0, 10, f"Te confirmamos tu cita para el servicio de {business_name}.")
    pdf.ln(10)
    
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(40, 10, 'Fecha:')
    pdf.set_font('Arial', '', 12)
    pdf.cell(0, 10, details.get('date', 'N/A'), 0, 1)
    
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(40, 10, 'Hora:')
    pdf.set_font('Arial', '', 12)
    pdf.cell(0, 10, details.get('time', 'N/A'), 0, 1)
    
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(40, 10, 'Dirección:')
    pdf.set_font('Arial', '', 12)
    pdf.multi_cell(0, 10, address)
    pdf.ln(10)
    
    pdf.set_font('Arial', 'I', 10)
    pdf.multi_cell(0, 10, footer_text)

    return bytes(pdf.output())

# --- CORRECCIÓN FINAL ---
def send_confirmation_email(user_email: str, details: Dict[str, Any], pdf_bytes: bytes):
    """
    Envía un correo de confirmación con el PDF adjunto (de forma síncrona).
    """
    message = emails.Message(
        subject=JinjaTemplate("Confirmación de tu cita en {{business_name}}"),
        html=JinjaTemplate("""
            <h1>¡Hola, {{user_name}}!</h1>
            <p>Tu cita en <strong>{{business_name}}</strong> para el día <strong>{{date}}</strong> a las <strong>{{time}}</strong> ha sido confirmada.</p>
            <p>Adjuntamos tu comprobante en formato PDF.</p>
            <p>¡Gracias por usar ServiBook!</p>
        """),
        mail_from=('ServiBook', settings.MAIL_USERNAME)
    )

    # Añadimos el adjunto al objeto del mensaje ANTES de enviarlo
    message.attach(
        filename=f'comprobante_cita_{details.get("id", "0")}.pdf',
        data=pdf_bytes
    )

    smtp_config = {
        "host": settings.MAIL_SERVER,
        "port": settings.MAIL_PORT,
        "user": settings.MAIL_USERNAME,
        "password": settings.MAIL_PASSWORD,
        "tls": True
    }

    # Ahora la función send no necesita el argumento 'attachments'
    response = message.send(
        to=user_email,
        render=details,
        smtp=smtp_config
    )
    
    if response.status_code not in [250, '250']:
        print(f"Error al enviar email: {response.status_code}")
        return False
    
    print(f"Correo de confirmación enviado a {user_email}")
    return True
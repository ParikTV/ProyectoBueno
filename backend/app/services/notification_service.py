# backend/app/services/notification_service.py

import qrcode
from fpdf import FPDF
from io import BytesIO
from typing import Dict, Any

# --- Generación de Código QR (sin cambios) ---
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

# --- Generación de PDF (Corregida) ---
class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        # Usamos .encode() para manejar caracteres especiales y lo decodificamos a 'latin-1'
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
    
    # Codificamos cada texto individualmente para asegurar compatibilidad con FPDF
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

    # FIX: Convertimos la salida a 'bytes' para que FastAPI la maneje correctamente.
    return bytes(pdf.output())

# --- Servicio de Email (Placeholder) ---
def send_confirmation_email(user_email: str, details: Dict[str, Any]):
    """
    Envía un correo de confirmación (Simulación).
    """
    print("--- SIMULANDO ENVÍO DE CORREO ---")
    print(f"PARA: {user_email}")
    print("ASUNTO: ¡Tu cita en ServiBook está confirmada!")
    print("\n--- CUERPO DEL CORREO ---")
    print(f"Hola, {details.get('user_name', 'Cliente')}!")
    print(f"Tu cita para {details.get('business_name')} el día {details.get('date')} a las {details.get('time')} ha sido confirmada.")
    print("------------------------------")
    pass
from http.server import BaseHTTPRequestHandler
import json
import base64
import fitz # PyMuPDF

def hex_to_rgb(color_int):
    r = ((color_int >> 16) & 255) / 255.0
    g = ((color_int >> 8) & 255) / 255.0
    b = (color_int & 255) / 255.0
    return (r, g, b)

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_error_response(400, "Empty request body")
                return
                
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            pdf_b64 = data.get('pdfBase64')
            replacements = data.get('replacements', [])
            
            if not pdf_b64:
                self.send_error_response(400, "Missing pdfBase64")
                return
                
            pdf_bytes = base64.b64decode(pdf_b64)
            
            # Open PDF from bytes
            doc = fitz.open("pdf", pdf_bytes)
            
            for page in doc:
                text_dict = page.get_text("dict")
                
                for replacement in replacements:
                    original_text = replacement.get("original", "").strip()
                    suggested_text = replacement.get("suggested", "").strip()
                    if not original_text or not suggested_text:
                        continue
                        
                    rects = page.search_for(original_text)
                    if not rects: 
                        continue
                        
                    for rect in rects:
                        font_size = 11.0
                        font_color = (0, 0, 0)
                        
                        found_style = False
                        for block in text_dict.get("blocks", []):
                            if block.get("type") != 0: continue
                            for line in block.get("lines", []):
                                for span in line.get("spans", []):
                                    span_rect = fitz.Rect(span["bbox"])
                                    if rect.intersects(span_rect):
                                        font_size = span["size"]
                                        font_color = hex_to_rgb(span["color"])
                                        found_style = True
                                        break
                                if found_style: break
                            if found_style: break
                        
                        # Add redaction annotation and apply it
                        page.add_redact_annot(rect, fill=None)
                        page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)
                        
                        # Insert new text
                        baseline_point = fitz.Point(rect.tl.x, rect.tl.y + (font_size * 0.85))
                        page.insert_text(
                            baseline_point, 
                            suggested_text, 
                            fontsize=font_size, 
                            color=font_color, 
                            fontname="helv",
                            render_mode=0
                        )
            
            out_bytes = doc.write(garbage=3, deflate=True)
            doc.close()
            
            # Send successful PDF response
            self.send_response(200)
            self.send_header('Content-Type', 'application/pdf')
            self.send_header('Content-Disposition', 'attachment; filename="Tailored_Resume.pdf"')
            self.end_headers()
            self.wfile.write(out_bytes)
            
        except Exception as e:
            self.send_error_response(500, str(e))
            
    def send_error_response(self, code, message):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode('utf-8'))

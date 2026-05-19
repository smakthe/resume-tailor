import sys
import json
import fitz # PyMuPDF

def hex_to_rgb(color_int):
    # PyMuPDF color is an integer representing sRGB: (R << 16) | (G << 8) | B
    r = ((color_int >> 16) & 255) / 255.0
    g = ((color_int >> 8) & 255) / 255.0
    b = (color_int & 255) / 255.0
    return (r, g, b)

def main():
    if len(sys.argv) < 4:
        print("Usage: python3 pdf_editor.py <input.pdf> <output.pdf> <replacements.json>")
        sys.exit(1)
        
    input_pdf = sys.argv[1]
    output_pdf = sys.argv[2]
    json_path = sys.argv[3]
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            replacements = json.load(f)
    except Exception as e:
        print(f"Error reading replacements: {e}")
        sys.exit(1)
        
    if not replacements:
        # Just copy input to output
        import shutil
        shutil.copy(input_pdf, output_pdf)
        sys.exit(0)

    try:
        doc = fitz.open(input_pdf)
    except Exception as e:
        print(f"Error opening PDF: {e}")
        sys.exit(1)
        
    for page in doc:
        # We need to find the style of the original text before redacting it.
        # get_text("dict") provides detailed font info for every span.
        text_dict = page.get_text("dict")
        
        for replacement in replacements:
            original_text = replacement.get("original", "").strip()
            suggested_text = replacement.get("suggested", "").strip()
            
            if not original_text or not suggested_text:
                continue
                
            # 1. Search for the text to get exact rectangles
            # Using quads=True allows handling rotated text, but rects are usually enough for standard resumes.
            rects = page.search_for(original_text)
            
            if not rects:
                # Sometimes words are split across spans. PyMuPDF's search_for is quite robust,
                # but if it fails, we move on.
                continue
                
            for rect in rects:
                # 2. Find the style (font size, color) by checking which span overlaps this rect.
                font_size = 11.0 # default fallback
                font_color = (0, 0, 0) # default fallback black
                
                # Scan dictionary to find matching span
                found_style = False
                for block in text_dict.get("blocks", []):
                    if block.get("type") != 0: continue # not text
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            span_rect = fitz.Rect(span["bbox"])
                            # If the search rect and span rect intersect significantly, we assume it's the right style
                            if rect.intersects(span_rect):
                                font_size = span["size"]
                                font_color = hex_to_rgb(span["color"])
                                found_style = True
                                break
                        if found_style: break
                    if found_style: break
                
                # 3. Add redaction annotation (this marks the text for deletion)
                page.add_redact_annot(rect, fill=None) # fill=None means it will just erase the text, leaving background intact
                
                # Apply redactions to physically remove the old text
                page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)
                
                # 4. Insert the new text at the top-left of the original rectangle.
                # We use a standard base font (Helvetica) because custom subset fonts cannot be reliably written to.
                # The text is aligned to the left of the original box.
                point = rect.tl # Top-Left corner
                # We adjust the Y coordinate slightly down because insert_text expects the bottom-left baseline by default.
                # Actually, in PyMuPDF, insert_text uses the bottom-left of the font bounding box if not specified, 
                # but rect.tl is top-left. We add font_size * 0.8 to approximate the baseline.
                baseline_point = fitz.Point(point.x, point.y + (font_size * 0.85))
                
                page.insert_text(
                    baseline_point, 
                    suggested_text, 
                    fontsize=font_size, 
                    color=font_color, 
                    fontname="helv", # Base-14 Helvetica
                    render_mode=0
                )

    try:
        doc.save(output_pdf, garbage=3, deflate=True)
        doc.close()
        print("Success")
    except Exception as e:
        print(f"Error saving PDF: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

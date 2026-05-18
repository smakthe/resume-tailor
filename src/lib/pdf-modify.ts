import { PDFDocument, PDFName, PDFRawStream, PDFArray, PDFRef } from "pdf-lib";
import pako from "pako";

/**
 * Applies text replacements directly inside the original PDF's content streams,
 * preserving layout, fonts, images, and all formatting.
 *
 * How it works:
 * 1. Loads the PDF with pdf-lib
 * 2. For each page, accesses the raw content stream(s)
 * 3. Decompresses (inflates) the stream if FlateDecode compressed
 * 4. Searches for PDF text operators containing the target strings
 * 5. Replaces matched text while preserving surrounding PDF operators
 * 6. Recompresses and writes back the modified stream
 * 7. pdf-lib handles xref table reconstruction on save
 */
export async function applyTextReplacementsToPdf(
  originalBytes: Uint8Array,
  replacements: Array<{ original: string; suggested: string }>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalBytes, {
    updateMetadata: false,
  });

  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const contentsRef = page.node.get(PDFName.of("Contents"));
    if (!contentsRef) continue;

    const refs = collectStreamRefs(pdfDoc, contentsRef);

    for (const ref of refs) {
      const stream = pdfDoc.context.lookup(ref);
      if (!(stream instanceof PDFRawStream)) continue;

      try {
        const decoded = decompressStream(stream);
        let text = latin1Decode(decoded);
        let modified = false;

        for (const { original, suggested } of replacements) {
          const { modifiedText, didModify } = replaceTextInStream(text, original, suggested);
          if (didModify) {
            text = modifiedText;
            modified = true;
          }
        }

        if (modified) {
          replaceStreamContent(pdfDoc, ref, stream, latin1Encode(text));
        }
      } catch {
        // Skip streams that can't be decoded (e.g., image streams)
        continue;
      }
    }
  }

  return pdfDoc.save();
}

/**
 * Collect all content stream refs for a page (handles both single ref and array)
 */
function collectStreamRefs(
  pdfDoc: PDFDocument,
  contentsEntry: unknown
): PDFRef[] {
  if (contentsEntry instanceof PDFRef) {
    const resolved = pdfDoc.context.lookup(contentsEntry);
    if (resolved instanceof PDFArray) {
      const refs: PDFRef[] = [];
      for (let i = 0; i < resolved.size(); i++) {
        const item = resolved.get(i);
        if (item instanceof PDFRef) refs.push(item);
      }
      return refs;
    }
    return [contentsEntry];
  }
  if (contentsEntry instanceof PDFArray) {
    const refs: PDFRef[] = [];
    for (let i = 0; i < contentsEntry.size(); i++) {
      const item = contentsEntry.get(i);
      if (item instanceof PDFRef) refs.push(item);
    }
    return refs;
  }
  return [];
}

/**
 * Decompress a raw PDF stream (handles FlateDecode)
 */
function decompressStream(stream: PDFRawStream): Uint8Array {
  const filter = stream.dict.get(PDFName.of("Filter"));
  const rawBytes = stream.getContents();

  if (filter && filter.toString() === "/FlateDecode") {
    return pako.inflate(rawBytes);
  }

  return rawBytes;
}

/**
 * Replace the content of a stream, re-compressing if it was originally compressed
 */
function replaceStreamContent(
  pdfDoc: PDFDocument,
  ref: PDFRef,
  originalStream: PDFRawStream,
  newBytes: Uint8Array
) {
  const filter = originalStream.dict.get(PDFName.of("Filter"));
  const wasCompressed =
    filter && filter.toString() === "/FlateDecode";

  const finalBytes = wasCompressed ? pako.deflate(newBytes) : newBytes;

  // Clone the original dictionary and update length
  const newDict = originalStream.dict.clone(pdfDoc.context);
  newDict.set(PDFName.of("Length"), pdfDoc.context.obj(finalBytes.length));

  if (!wasCompressed) {
    newDict.delete(PDFName.of("Filter"));
    newDict.delete(PDFName.of("DecodeParms"));
  }

  const newStream = PDFRawStream.of(newDict, finalBytes);
  pdfDoc.context.assign(ref, newStream);
}

/**
 * Escape special characters used in PDF string literals: \ ( )
 */
function escapePdfStringContent(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * Decode bytes using Latin-1 (ISO 8859-1) — the encoding used in most PDF content streams
 */
function latin1Decode(bytes: Uint8Array): string {
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i]);
  }
  return result;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceTextInStream(
  text: string,
  original: string,
  suggested: string
): { modifiedText: string; didModify: boolean } {
  const escapedOrig = escapePdfStringContent(original);
  const escapedSugg = escapePdfStringContent(suggested);

  // 1. Try exact match first
  if (text.includes(escapedOrig)) {
    return {
      modifiedText: text.replaceAll(escapedOrig, escapedSugg),
      didModify: true,
    };
  }
  if (text.includes(original)) {
    return {
      modifiedText: text.replaceAll(original, suggested),
      didModify: true,
    };
  }

  // 2. Word-by-word match (handles PDF kerning operators and line breaks)
  const words = original.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length > 1) {
    let regexStr = "";
    for (let i = 0; i < words.length; i++) {
      const wordEsc = escapeRegExp(escapePdfStringContent(words[i]));
      regexStr += `(${wordEsc})`;
      if (i < words.length - 1) {
        // Gap can contain PDF string closures, kerning, positioning, newlines, etc.
        // Restrict to max 150 chars to avoid catastrophic backtracking
        regexStr += `(.{1,150}?)`;
      }
    }

    try {
      const regex = new RegExp(regexStr, "g"); // Match all occurrences
      let matched = false;
      const newText = text.replace(regex, (...args) => {
        matched = true;
        // args[0] = full match
        // args[1] = word1, args[2] = gap1, args[3] = word2, etc.
        let resultStr = escapedSugg;
        // Append all the original gaps, and use empty strings for the subsequent words
        for (let i = 2; i < args.length - 2; i += 2) {
          resultStr += args[i]; // The gap
          resultStr += ""; // The next word (replaced by nothing)
        }
        return resultStr;
      });

      if (matched) {
        return { modifiedText: newText, didModify: true };
      }
    } catch (e) {
      console.error("Regex generation error for PDF matching:", e);
    }
  }

  return { modifiedText: text, didModify: false };
}

/**
 * Encode a string to Latin-1 bytes
 */
function latin1Encode(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i) & 0xff;
  }
  return bytes;
}

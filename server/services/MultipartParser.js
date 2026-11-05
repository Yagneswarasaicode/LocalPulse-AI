/**
 * MultipartParser.js
 * Pure Node.js secure multipart and file signature validator.
 * Validates magic numbers, enforces upload bounds, and checks PDF page limits without external dependencies.
 */

const MAX_UPLOAD_SIZE_BYTES = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10', 10) * 1024 * 1024;
const MAX_PDF_PAGES = parseInt(process.env.MAX_PDF_PAGES || '5', 10);

/**
 * Detect actual file signature / magic number from buffer
 */
export function detectFileSignature(buffer) {
  if (!buffer || buffer.length < 4) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return 'image/png';
  }

  // PDF: %PDF- (25 50 44 46 2D)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  return null;
}

/**
 * Count pages in a PDF buffer by inspecting page dictionary markers
 */
export function countPdfPages(buffer) {
  const content = buffer.toString('latin1');
  // Match /Type /Page (excluding /Pages)
  const matches = content.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 0;
}

/**
 * Validate file buffer against security and format constraints
 */
export function validateFileBuffer(buffer, declaredMimeType, fileName = 'upload') {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file payload' };
  }

  // 1. Upload size bound
  if (buffer.length > MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit (${(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB)`
    };
  }

  // 2. Magic number detection
  const detectedMime = detectFileSignature(buffer);
  if (!detectedMime) {
    return {
      valid: false,
      error: 'Unsupported or corrupted file format. Only JPG, PNG, and PDF are supported.'
    };
  }

  // 3. Mime-type mismatch check
  const normalizedDeclared = (declaredMimeType || '').toLowerCase();
  if (
    normalizedDeclared &&
    normalizedDeclared !== detectedMime &&
    !(normalizedDeclared === 'image/jpg' && detectedMime === 'image/jpeg')
  ) {
    return {
      valid: false,
      error: `MIME type mismatch: declared "${declaredMimeType}" does not match file signature "${detectedMime}"`
    };
  }

  // 4. PDF page limit & corruption check
  if (detectedMime === 'application/pdf') {
    const pageCount = countPdfPages(buffer);
    if (pageCount === 0) {
      return {
        valid: false,
        error: 'Malformed or unreadable PDF document (no valid pages found)'
      };
    }
    if (pageCount > MAX_PDF_PAGES) {
      return {
        valid: false,
        error: `PDF exceeds maximum allowed page limit (found ${pageCount} pages, maximum allowed is ${MAX_PDF_PAGES})`
      };
    }
  }

  return {
    valid: true,
    mimeType: detectedMime,
    sizeBytes: buffer.length,
    fileName,
  };
}

/**
 * Parse standard multipart/form-data raw buffer
 */
export function parseMultipartFormData(rawBuffer, contentTypeHeader) {
  if (!contentTypeHeader || !contentTypeHeader.includes('boundary=')) {
    return { fields: {}, files: [] };
  }

  const boundaryMatch = contentTypeHeader.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    return { fields: {}, files: [] };
  }

  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const endBoundaryBuffer = Buffer.from(`--${boundary}--`);

  const parts = [];
  let start = 0;

  while (start < rawBuffer.length) {
    const idx = rawBuffer.indexOf(boundaryBuffer, start);
    if (idx === -1) break;

    const nextIdx = rawBuffer.indexOf(boundaryBuffer, idx + boundaryBuffer.length);
    if (nextIdx === -1) {
      // Check for ending boundary
      const endIdx = rawBuffer.indexOf(endBoundaryBuffer, idx);
      if (endIdx !== -1) {
        parts.push(rawBuffer.subarray(idx + boundaryBuffer.length, endIdx));
      }
      break;
    }

    parts.push(rawBuffer.subarray(idx + boundaryBuffer.length, nextIdx));
    start = nextIdx;
  }

  const fields = {};
  const files = [];

  for (const part of parts) {
    // Split header from body by \r\n\r\n or \n\n
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd === -1) continue;

    const headerStr = part.subarray(0, headerEnd).toString('utf8');
    let body = part.subarray(headerEnd + 4);

    // Trim trailing CRLF before next boundary
    if (body.length >= 2 && body[body.length - 2] === 0x0D && body[body.length - 1] === 0x0A) {
      body = body.subarray(0, body.length - 2);
    }

    const dispositionMatch = headerStr.match(/content-disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
    if (!dispositionMatch) continue;

    const name = dispositionMatch[1];
    const filename = dispositionMatch[2];

    if (filename) {
      const typeMatch = headerStr.match(/content-type:\s*([^\r\n;]+)/i);
      const mimeType = typeMatch ? typeMatch[1].trim() : 'application/octet-stream';
      files.push({
        fieldname: name,
        filename,
        mimeType,
        buffer: body,
      });
    } else {
      fields[name] = body.toString('utf8').trim();
    }
  }

  return { fields, files };
}

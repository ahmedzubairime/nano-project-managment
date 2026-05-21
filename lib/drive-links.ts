export interface DriveLinkMetadata {
  isValid: boolean;
  type: 'document' | 'spreadsheet' | 'presentation' | 'form' | 'folder' | 'file' | 'unknown';
  id: string | null;
  label: string;
  normalizedUrl: string;
}

/**
 * Validates whether the given string is a valid URL and belongs to drive.google.com or docs.google.com.
 */
export function validateDriveUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    let cleaned = url.trim();
    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = 'https://' + cleaned;
    }
    const parsed = new URL(cleaned);
    const hostname = parsed.hostname.toLowerCase();
    
    // Support exact matches or subdomains for docs/drive
    return hostname === 'drive.google.com' || hostname === 'docs.google.com';
  } catch {
    return false;
  }
}

/**
 * Normalizes a Google Drive URL by trimming, ensuring https, and parsing it cleanly.
 */
export function normalizeDriveUrl(url: string | null | undefined): string {
  if (!url) return '';
  let cleaned = url.trim();
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = 'https://' + cleaned;
  }
  try {
    const parsed = new URL(cleaned);
    return parsed.toString();
  } catch {
    return cleaned;
  }
}

/**
 * Parses a Google Drive URL offline to extract the type, ID, and build a user-friendly label.
 */
export function parseDriveUrl(url: string | null | undefined): DriveLinkMetadata {
  const result: DriveLinkMetadata = {
    isValid: false,
    type: 'unknown',
    id: null,
    label: 'Google Drive Link',
    normalizedUrl: url ? url.trim() : '',
  };

  if (!url) return result;

  try {
    const normalized = normalizeDriveUrl(url);
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname !== 'drive.google.com' && hostname !== 'docs.google.com') {
      return result;
    }

    result.isValid = true;
    result.normalizedUrl = normalized;
    const pathname = parsed.pathname;

    // Detect specific document types and extract IDs
    if (pathname.includes('/spreadsheets/d/')) {
      result.type = 'spreadsheet';
      const match = pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      result.id = match ? match[1] : null;
      result.label = 'Google Sheet';
    } else if (pathname.includes('/document/d/')) {
      result.type = 'document';
      const match = pathname.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
      result.id = match ? match[1] : null;
      result.label = 'Google Doc';
    } else if (pathname.includes('/presentation/d/')) {
      result.type = 'presentation';
      const match = pathname.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
      result.id = match ? match[1] : null;
      result.label = 'Google Slides';
    } else if (pathname.includes('/forms/d/')) {
      result.type = 'form';
      const match = pathname.match(/\/forms\/d\/(e\/[a-zA-Z0-9-_]+|[a-zA-Z0-9-_]+)/);
      result.id = match ? match[1] : null;
      result.label = 'Google Form';
    } else if (pathname.includes('/folders/')) {
      result.type = 'folder';
      const match = pathname.match(/\/folders\/([a-zA-Z0-9-_]+)/);
      result.id = match ? match[1] : null;
      result.label = 'Google Folder';
    } else if (pathname.includes('/file/d/')) {
      result.type = 'file';
      const match = pathname.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
      result.id = match ? match[1] : null;
      result.label = 'Google File';
    } else {
      result.type = 'unknown';
      result.label = 'Google Drive Link';
    }

    // Build display-friendly short label if ID was parsed successfully
    if (result.id) {
      const shortId = result.id.length > 8
        ? `${result.id.slice(0, 4)}...${result.id.slice(-4)}`
        : result.id;
      result.label = `${result.label} (${shortId})`;
    }
  } catch {
    result.isValid = false;
  }

  return result;
}

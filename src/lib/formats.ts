/**
 * Format configurations and conversion capabilities
 */

import type {
  ImageFormat,
  FormatSupport,
  FormatCapability,
  MimeTypeMap,
  FileMagicBytes,
} from './types';

/**
 * Maximum file size (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Maximum image dimensions (4096x4096)
 */
export const MAX_DIMENSION = 4096;

/**
 * Minimum image dimensions
 */
export const MIN_DIMENSION = 1;

/**
 * Default quality for lossy formats
 */
export const DEFAULT_QUALITY = 90;

/**
 * Formats supported by client-side Canvas API
 */
export const CLIENT_FORMATS: ImageFormat[] = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif', // Read-only, can convert FROM gif to other formats
];

/**
 * Formats supported by server-side Sharp library
 */
export const SERVER_FORMATS: ImageFormat[] = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'avif',
  'tiff',
  'bmp',
];

/**
 * MIME type to format mapping
 */
export const MIME_TYPE_MAP: MimeTypeMap = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/tiff': 'tiff',
  'image/bmp': 'bmp',
  'image/x-ms-bmp': 'bmp',
};

/**
 * Format to MIME type mapping
 */
export const FORMAT_TO_MIME: Record<ImageFormat, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  tiff: 'image/tiff',
  bmp: 'image/bmp',
};

/**
 * File extension to format mapping
 */
export const EXTENSION_MAP: Record<string, ImageFormat> = {
  jpg: 'jpg',
  jpeg: 'jpeg',
  png: 'png',
  webp: 'webp',
  gif: 'gif',
  avif: 'avif',
  tiff: 'tiff',
  tif: 'tiff',
  bmp: 'bmp',
};

/**
 * File magic bytes (signatures) for format detection
 * Used for additional validation beyond MIME type
 */
export const MAGIC_BYTES: FileMagicBytes[] = [
  {
    format: 'jpg',
    signature: [0xff, 0xd8, 0xff],
    offset: 0,
  },
  {
    format: 'png',
    signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    offset: 0,
  },
  {
    format: 'gif',
    signature: [0x47, 0x49, 0x46, 0x38], // GIF8
    offset: 0,
  },
  {
    format: 'webp',
    signature: [0x52, 0x49, 0x46, 0x46], // RIFF
    offset: 0,
  },
  {
    format: 'tiff',
    signature: [0x49, 0x49, 0x2a, 0x00], // Little-endian TIFF
    offset: 0,
  },
  {
    format: 'tiff',
    signature: [0x4d, 0x4d, 0x00, 0x2a], // Big-endian TIFF
    offset: 0,
  },
  {
    format: 'bmp',
    signature: [0x42, 0x4d], // BM
    offset: 0,
  },
];

/**
 * Formats that support lossy compression (quality parameter)
 */
export const LOSSY_FORMATS: ImageFormat[] = ['jpg', 'jpeg', 'webp', 'avif'];

/**
 * Formats that support transparency
 */
export const TRANSPARENT_FORMATS: ImageFormat[] = ['png', 'webp', 'gif', 'avif', 'tiff'];

/**
 * Allowed MIME types (for validation)
 */
export const ALLOWED_MIME_TYPES = Object.keys(MIME_TYPE_MAP);

/**
 * Conversion capabilities matrix
 */
export const CONVERSION_MATRIX: FormatCapability[] = [
  // Client-side conversions
  {
    from: 'jpg',
    to: ['png', 'webp', 'gif'],
    method: 'client',
  },
  {
    from: 'jpeg',
    to: ['png', 'webp', 'gif'],
    method: 'client',
  },
  {
    from: 'png',
    to: ['jpg', 'jpeg', 'webp', 'gif'],
    method: 'client',
  },
  {
    from: 'webp',
    to: ['jpg', 'jpeg', 'png', 'gif'],
    method: 'client',
  },
  {
    from: 'gif',
    to: ['jpg', 'jpeg', 'png', 'webp'],
    method: 'client',
  },

  // Server-side only conversions
  {
    from: 'avif',
    to: ['jpg', 'jpeg', 'png', 'webp'],
    method: 'server',
  },
  {
    from: 'tiff',
    to: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    method: 'server',
  },
  {
    from: 'bmp',
    to: ['jpg', 'jpeg', 'png', 'webp'],
    method: 'server',
  },

  // Server-side enhanced conversions (with advanced options)
  {
    from: 'jpg',
    to: ['avif', 'tiff'],
    method: 'server',
  },
  {
    from: 'png',
    to: ['avif', 'tiff'],
    method: 'server',
  },
  {
    from: 'webp',
    to: ['avif', 'tiff'],
    method: 'server',
  },
];

/**
 * Get complete format support information
 */
export function getFormatSupport(): FormatSupport {
  return {
    formats: {
      image: {
        client: CLIENT_FORMATS,
        server: SERVER_FORMATS,
      },
    },
    conversions: CONVERSION_MATRIX,
    limits: {
      maxFileSize: MAX_FILE_SIZE,
      maxDimensions: MAX_DIMENSION,
      minDimensions: MIN_DIMENSION,
    },
  };
}

/**
 * Get MIME type from format
 */
export function getMimeType(format: ImageFormat): string {
  return FORMAT_TO_MIME[format] || 'application/octet-stream';
}

/**
 * Get format from MIME type
 */
export function getFormatFromMime(mimeType: string): ImageFormat | null {
  return MIME_TYPE_MAP[mimeType.toLowerCase()] || null;
}

/**
 * Get format from file extension
 */
export function getFormatFromExtension(filename: string): ImageFormat | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? EXTENSION_MAP[ext] || null : null;
}

/**
 * Check if format is supported
 */
export function isSupportedFormat(format: string): boolean {
  return SERVER_FORMATS.includes(format as ImageFormat);
}

/**
 * Check if conversion is supported
 */
export function isConversionSupported(
  from: ImageFormat,
  to: ImageFormat,
): boolean {
  return CONVERSION_MATRIX.some(
    (cap) => cap.from === from && cap.to.includes(to),
  );
}

/**
 * Check if format supports quality parameter
 */
export function supportsQuality(format: ImageFormat): boolean {
  return LOSSY_FORMATS.includes(format);
}

/**
 * Check if format supports transparency
 */
export function supportsTransparency(format: ImageFormat): boolean {
  return TRANSPARENT_FORMATS.includes(format);
}

/**
 * Get recommended conversion method for format pair
 */
export function getConversionMethod(
  from: ImageFormat,
  to: ImageFormat,
): 'client' | 'server' | null {
  const capability = CONVERSION_MATRIX.find(
    (cap) => cap.from === from && cap.to.includes(to),
  );
  return capability?.method || null;
}

/**
 * Get all possible output formats for a given input format
 */
export function getPossibleOutputFormats(from: ImageFormat): ImageFormat[] {
  const formats = new Set<ImageFormat>();

  CONVERSION_MATRIX.forEach((cap) => {
    if (cap.from === from) {
      cap.to.forEach((format) => formats.add(format));
    }
  });

  return Array.from(formats);
}

/**
 * Normalize format (jpeg -> jpg)
 */
export function normalizeFormat(format: string): ImageFormat {
  const normalized = format.toLowerCase();
  return normalized === 'jpeg' ? 'jpg' : (normalized as ImageFormat);
}

/**
 * Get file extension for format
 */
export function getExtensionForFormat(format: ImageFormat): string {
  return format === 'jpeg' ? 'jpg' : format;
}

/**
 * Check if MIME type is allowed
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase());
}

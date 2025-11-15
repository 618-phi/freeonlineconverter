/**
 * File validation functions
 */

import type { ValidationResult, ImageFormat } from './types';
import { ErrorCode } from './types';
import {
  MAX_FILE_SIZE,
  MAX_DIMENSION,
  MIN_DIMENSION,
  ALLOWED_MIME_TYPES,
  MAGIC_BYTES,
  isSupportedFormat,
  isConversionSupported,
  supportsQuality,
} from './formats';
import {
  sanitizeFilename,
  detectMimeTypeFromBuffer,
  validateQuality,
  validateDimensions,
} from './utils';

/**
 * Validate file type using MIME type
 */
export function validateFileType(
  mimeType: string,
  allowedTypes: string[] = ALLOWED_MIME_TYPES,
): ValidationResult {
  const normalizedMime = mimeType.toLowerCase();

  if (!allowedTypes.includes(normalizedMime)) {
    return {
      valid: false,
      error: 'Invalid file type',
      code: ErrorCode.INVALID_FILE_TYPE,
      details: {
        receivedType: mimeType,
        supportedTypes: allowedTypes,
      },
    };
  }

  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(
  fileSize: number,
  maxSize: number = MAX_FILE_SIZE,
): ValidationResult {
  if (fileSize > maxSize) {
    return {
      valid: false,
      error: 'File too large',
      code: ErrorCode.FILE_TOO_LARGE,
      details: {
        fileSize,
        maxSize,
      },
    };
  }

  if (fileSize === 0) {
    return {
      valid: false,
      error: 'File is empty',
      code: ErrorCode.FILE_TOO_SMALL,
      details: {
        fileSize,
      },
    };
  }

  return { valid: true };
}

/**
 * Validate image dimensions
 */
export function validateImageDimensions(
  width: number,
  height: number,
  maxDimension: number = MAX_DIMENSION,
  minDimension: number = MIN_DIMENSION,
): ValidationResult {
  if (!validateDimensions(width, height, maxDimension, minDimension)) {
    return {
      valid: false,
      error: 'Invalid image dimensions',
      code: ErrorCode.INVALID_DIMENSIONS,
      details: {
        width,
        height,
        maxDimension,
        minDimension,
      },
    };
  }

  return { valid: true };
}

/**
 * Validate format
 */
export function validateFormat(format: string): ValidationResult {
  if (!isSupportedFormat(format)) {
    return {
      valid: false,
      error: 'Unsupported format',
      code: ErrorCode.UNSUPPORTED_FORMAT,
      details: {
        format,
      },
    };
  }

  return { valid: true };
}

/**
 * Validate conversion
 */
export function validateConversion(
  fromFormat: ImageFormat,
  toFormat: ImageFormat,
): ValidationResult {
  if (!isConversionSupported(fromFormat, toFormat)) {
    return {
      valid: false,
      error: 'Unsupported conversion',
      code: ErrorCode.UNSUPPORTED_OPERATION,
      details: {
        from: fromFormat,
        to: toFormat,
      },
    };
  }

  return { valid: true };
}

/**
 * Validate quality parameter
 */
export function validateQualityParameter(
  quality: number | undefined,
  format: ImageFormat,
): ValidationResult {
  if (quality === undefined) {
    return { valid: true };
  }

  if (!validateQuality(quality)) {
    return {
      valid: false,
      error: 'Invalid quality value',
      code: ErrorCode.INVALID_QUALITY,
      details: {
        quality,
        validRange: '1-100',
      },
    };
  }

  // Warn if quality is specified for lossless format (but don't fail)
  if (!supportsQuality(format)) {
    return {
      valid: true,
      details: {
        warning: `Quality parameter ignored for ${format} format`,
      },
    };
  }

  return { valid: true };
}

/**
 * Validate file using magic bytes
 */
export async function validateFileWithMagicBytes(
  file: File | Buffer,
): Promise<ValidationResult> {
  try {
    let buffer: ArrayBuffer;

    if (file instanceof Buffer) {
      buffer = file.buffer.slice(
        file.byteOffset,
        file.byteOffset + file.byteLength,
      );
    } else {
      // Read first 12 bytes for magic byte detection
      const blob = file.slice(0, 12);
      buffer = await blob.arrayBuffer();
    }

    const detectedMime = detectMimeTypeFromBuffer(buffer);

    if (!detectedMime) {
      return {
        valid: false,
        error: 'Could not detect file type from content',
        code: ErrorCode.INVALID_FILE_TYPE,
      };
    }

    if (!ALLOWED_MIME_TYPES.includes(detectedMime)) {
      return {
        valid: false,
        error: 'Unsupported file type detected',
        code: ErrorCode.UNSUPPORTED_FORMAT,
        details: {
          detectedType: detectedMime,
        },
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Error reading file',
      code: ErrorCode.CORRUPTED_FILE,
    };
  }
}

/**
 * Validate filename
 */
export function validateFilename(filename: string): ValidationResult {
  if (!filename || filename.trim() === '') {
    return {
      valid: false,
      error: 'Filename is required',
      code: ErrorCode.MISSING_PARAMETER,
    };
  }

  // Check for path traversal attempts
  if (
    filename.includes('..') ||
    filename.includes('/') ||
    filename.includes('\\')
  ) {
    return {
      valid: false,
      error: 'Invalid filename',
      code: ErrorCode.INVALID_FILE_TYPE,
      details: {
        reason: 'Filename contains invalid characters',
      },
    };
  }

  // Check for null bytes
  if (filename.includes('\0')) {
    return {
      valid: false,
      error: 'Invalid filename',
      code: ErrorCode.INVALID_FILE_TYPE,
      details: {
        reason: 'Filename contains null bytes',
      },
    };
  }

  return { valid: true };
}

/**
 * Comprehensive file validation
 */
export async function validateFile(
  file: File,
  options?: {
    maxSize?: number;
    allowedTypes?: string[];
    checkMagicBytes?: boolean;
  },
): Promise<ValidationResult> {
  const {
    maxSize = MAX_FILE_SIZE,
    allowedTypes = ALLOWED_MIME_TYPES,
    checkMagicBytes = true,
  } = options || {};

  // Validate filename
  const filenameValidation = validateFilename(file.name);
  if (!filenameValidation.valid) {
    return filenameValidation;
  }

  // Validate file size
  const sizeValidation = validateFileSize(file.size, maxSize);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Validate MIME type
  const typeValidation = validateFileType(file.type, allowedTypes);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  // Validate using magic bytes (optional but recommended)
  if (checkMagicBytes) {
    const magicBytesValidation = await validateFileWithMagicBytes(file);
    if (!magicBytesValidation.valid) {
      return magicBytesValidation;
    }
  }

  return { valid: true };
}

/**
 * Validate buffer (server-side)
 */
export async function validateBuffer(
  buffer: Buffer,
  mimeType: string,
  options?: {
    maxSize?: number;
    checkMagicBytes?: boolean;
  },
): Promise<ValidationResult> {
  const { maxSize = MAX_FILE_SIZE, checkMagicBytes = true } = options || {};

  // Validate size
  const sizeValidation = validateFileSize(buffer.length, maxSize);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Validate MIME type
  const typeValidation = validateFileType(mimeType);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  // Validate using magic bytes
  if (checkMagicBytes) {
    const magicBytesValidation = await validateFileWithMagicBytes(buffer);
    if (!magicBytesValidation.valid) {
      return magicBytesValidation;
    }
  }

  return { valid: true };
}

/**
 * Check if file is potentially malicious
 */
export function isPotentiallyMalicious(filename: string): boolean {
  const sanitized = sanitizeFilename(filename);

  // List of dangerous extensions
  const dangerousExtensions = [
    'exe',
    'bat',
    'cmd',
    'com',
    'pif',
    'scr',
    'vbs',
    'js',
    'jar',
    'sh',
    'app',
    'deb',
    'rpm',
  ];

  const ext = filename.split('.').pop()?.toLowerCase();

  if (ext && dangerousExtensions.includes(ext)) {
    return true;
  }

  // Check if sanitized version is very different (suspicious)
  if (sanitized.length < filename.length * 0.5) {
    return true;
  }

  return false;
}

/**
 * Validate all conversion parameters
 */
export function validateConversionParameters(params: {
  inputFormat: ImageFormat;
  outputFormat: ImageFormat;
  quality?: number;
  width?: number;
  height?: number;
}): ValidationResult {
  const { inputFormat, outputFormat, quality, width, height } = params;

  // Validate formats
  const inputFormatValidation = validateFormat(inputFormat);
  if (!inputFormatValidation.valid) {
    return inputFormatValidation;
  }

  const outputFormatValidation = validateFormat(outputFormat);
  if (!outputFormatValidation.valid) {
    return outputFormatValidation;
  }

  // Validate conversion is supported
  const conversionValidation = validateConversion(inputFormat, outputFormat);
  if (!conversionValidation.valid) {
    return conversionValidation;
  }

  // Validate quality if provided
  if (quality !== undefined) {
    const qualityValidation = validateQualityParameter(quality, outputFormat);
    if (!qualityValidation.valid) {
      return qualityValidation;
    }
  }

  // Validate dimensions if provided
  if (width !== undefined || height !== undefined) {
    const w = width || MAX_DIMENSION;
    const h = height || MAX_DIMENSION;

    if (width !== undefined && (width < MIN_DIMENSION || width > MAX_DIMENSION)) {
      return {
        valid: false,
        error: 'Invalid width',
        code: ErrorCode.INVALID_DIMENSIONS,
        details: {
          width,
          min: MIN_DIMENSION,
          max: MAX_DIMENSION,
        },
      };
    }

    if (height !== undefined && (height < MIN_DIMENSION || height > MAX_DIMENSION)) {
      return {
        valid: false,
        error: 'Invalid height',
        code: ErrorCode.INVALID_DIMENSIONS,
        details: {
          height,
          min: MIN_DIMENSION,
          max: MAX_DIMENSION,
        },
      };
    }
  }

  return { valid: true };
}

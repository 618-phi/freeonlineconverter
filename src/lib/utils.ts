/**
 * Utility functions for file conversion
 */

import type { ApiError, ImageFormat } from './types';
import { ErrorCode, HttpStatus } from './types';

/**
 * Sanitize filename to prevent directory traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  let sanitized = filename.replace(/[\/\\:\0]/g, '_');

  // Remove any characters that aren't alphanumeric, dash, underscore, or dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Prevent multiple consecutive dots (potential security issue)
  sanitized = sanitized.replace(/\.{2,}/g, '.');

  // Limit length to 255 characters (filesystem limit)
  sanitized = sanitized.substring(0, 255);

  // Ensure it's not empty
  if (!sanitized || sanitized === '.') {
    sanitized = 'converted_file';
  }

  return sanitized;
}

/**
 * Change file extension
 */
export function changeExtension(
  filename: string,
  newExtension: string,
): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    parts.pop(); // Remove old extension
  }
  return `${parts.join('.')}.${newExtension}`;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Create API error response
 */
export function createApiError(
  error: string,
  message: string,
  code: ErrorCode,
  details?: Record<string, any>,
): ApiError {
  return {
    error,
    message,
    code,
    details,
  };
}

/**
 * Get HTTP status code from error code
 */
export function getHttpStatusFromErrorCode(code: ErrorCode): number {
  switch (code) {
    // Validation errors (400)
    case ErrorCode.INVALID_FILE_TYPE:
    case ErrorCode.INVALID_FORMAT:
    case ErrorCode.MISSING_PARAMETER:
    case ErrorCode.INVALID_QUALITY:
      return HttpStatus.BAD_REQUEST;

    // File size errors (413)
    case ErrorCode.FILE_TOO_LARGE:
      return HttpStatus.PAYLOAD_TOO_LARGE;

    // Unsupported format (415)
    case ErrorCode.UNSUPPORTED_FORMAT:
      return HttpStatus.UNSUPPORTED_MEDIA_TYPE;

    // Processing errors (422)
    case ErrorCode.CONVERSION_FAILED:
    case ErrorCode.CORRUPTED_FILE:
    case ErrorCode.UNSUPPORTED_OPERATION:
    case ErrorCode.DIMENSION_LIMIT_EXCEEDED:
    case ErrorCode.FILE_TOO_SMALL:
    case ErrorCode.INVALID_DIMENSIONS:
      return HttpStatus.UNPROCESSABLE_ENTITY;

    // Server errors (500)
    case ErrorCode.INTERNAL_ERROR:
    case ErrorCode.SHARP_ERROR:
    case ErrorCode.FILE_SYSTEM_ERROR:
    case ErrorCode.OUT_OF_MEMORY:
      return HttpStatus.INTERNAL_SERVER_ERROR;

    default:
      return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

/**
 * Detect MIME type from file buffer (magic bytes)
 */
export function detectMimeTypeFromBuffer(buffer: ArrayBuffer): string | null {
  const uint8Array = new Uint8Array(buffer);

  // Check for common image formats
  if (uint8Array.length < 12) return null;

  // JPEG
  if (
    uint8Array[0] === 0xff &&
    uint8Array[1] === 0xd8 &&
    uint8Array[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  // PNG
  if (
    uint8Array[0] === 0x89 &&
    uint8Array[1] === 0x50 &&
    uint8Array[2] === 0x4e &&
    uint8Array[3] === 0x47
  ) {
    return 'image/png';
  }

  // GIF
  if (
    uint8Array[0] === 0x47 &&
    uint8Array[1] === 0x49 &&
    uint8Array[2] === 0x46
  ) {
    return 'image/gif';
  }

  // WebP (RIFF....WEBP)
  if (
    uint8Array[0] === 0x52 &&
    uint8Array[1] === 0x49 &&
    uint8Array[2] === 0x46 &&
    uint8Array[3] === 0x46 &&
    uint8Array[8] === 0x57 &&
    uint8Array[9] === 0x45 &&
    uint8Array[10] === 0x42 &&
    uint8Array[11] === 0x50
  ) {
    return 'image/webp';
  }

  // BMP
  if (uint8Array[0] === 0x42 && uint8Array[1] === 0x4d) {
    return 'image/bmp';
  }

  // TIFF (little-endian)
  if (
    uint8Array[0] === 0x49 &&
    uint8Array[1] === 0x49 &&
    uint8Array[2] === 0x2a &&
    uint8Array[3] === 0x00
  ) {
    return 'image/tiff';
  }

  // TIFF (big-endian)
  if (
    uint8Array[0] === 0x4d &&
    uint8Array[1] === 0x4d &&
    uint8Array[2] === 0x00 &&
    uint8Array[3] === 0x2a
  ) {
    return 'image/tiff';
  }

  return null;
}

/**
 * Validate quality parameter
 */
export function validateQuality(quality: number): boolean {
  return quality >= 1 && quality <= 100;
}

/**
 * Clamp quality to valid range
 */
export function clampQuality(quality: number): number {
  return Math.max(1, Math.min(100, Math.round(quality)));
}

/**
 * Check if file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Generate output filename
 */
export function generateOutputFilename(
  inputFilename: string,
  outputFormat: ImageFormat,
): string {
  const sanitized = sanitizeFilename(inputFilename);
  return changeExtension(sanitized, outputFormat);
}

/**
 * Parse multipart form data field
 */
export function parseFormField(
  value: string | null | undefined,
  defaultValue?: string,
): string | undefined {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  return value;
}

/**
 * Parse numeric form field
 */
export function parseNumericField(
  value: string | null | undefined,
  defaultValue?: number,
): number | undefined {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Parse boolean form field
 */
export function parseBooleanField(
  value: string | null | undefined,
  defaultValue: boolean = false,
): boolean {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  return value === 'true' || value === '1';
}

/**
 * Convert Buffer to ArrayBuffer
 */
export function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

/**
 * Convert ArrayBuffer to Buffer
 */
export function arrayBufferToBuffer(arrayBuffer: ArrayBuffer): Buffer {
  return Buffer.from(arrayBuffer);
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a safe error message (don't leak sensitive info)
 */
export function createSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Only return the message, not the stack trace
    return error.message;
  }
  return 'An unknown error occurred';
}

/**
 * Log error (in production, this would send to error tracking service)
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
    if (context) {
      console.error('Context:', context);
    }
  }
  // In production: Send to Sentry, LogRocket, etc.
}

/**
 * Validate dimensions
 */
export function validateDimensions(
  width: number,
  height: number,
  maxDimension: number,
  minDimension: number = 1,
): boolean {
  return (
    width >= minDimension &&
    height >= minDimension &&
    width <= maxDimension &&
    height <= maxDimension
  );
}

/**
 * Calculate aspect ratio
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * Calculate dimensions maintaining aspect ratio
 */
export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number,
): { width: number; height: number } {
  if (!targetWidth && !targetHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = calculateAspectRatio(originalWidth, originalHeight);

  if (targetWidth && !targetHeight) {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio),
    };
  }

  if (targetHeight && !targetWidth) {
    return {
      width: Math.round(targetHeight * aspectRatio),
      height: targetHeight,
    };
  }

  // Both specified - maintain aspect ratio, fit within bounds
  if (targetWidth && targetHeight) {
    const targetAspect = calculateAspectRatio(targetWidth, targetHeight);

    if (aspectRatio > targetAspect) {
      // Width constrained
      return {
        width: targetWidth,
        height: Math.round(targetWidth / aspectRatio),
      };
    } else {
      // Height constrained
      return {
        width: Math.round(targetHeight * aspectRatio),
        height: targetHeight,
      };
    }
  }

  return { width: originalWidth, height: originalHeight };
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await sleep(delayMs * Math.pow(2, i));
      }
    }
  }

  throw lastError;
}

/**
 * Type definitions for the file converter application
 */

// Supported image formats
export type ImageFormat =
  | 'jpg'
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'gif'
  | 'avif'
  | 'tiff'
  | 'bmp';

// Conversion method (client-side browser or server-side)
export type ConversionMethod = 'client' | 'server';

// Image resize fit modes
export type ResizeFit = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

/**
 * Request payload for file conversion
 */
export interface ConversionRequest {
  file: File;
  outputFormat: ImageFormat;
  quality?: number; // 1-100, only for lossy formats
  width?: number;
  height?: number;
  maintainAspect?: boolean;
}

/**
 * Conversion options for internal processing
 */
export interface ConversionOptions {
  outputFormat: ImageFormat;
  quality?: number; // 1-100
  width?: number;
  height?: number;
  fit?: ResizeFit;
}

/**
 * Result of a conversion operation
 */
export interface ConversionResult {
  success: boolean;
  data?: ArrayBuffer | Blob | Buffer;
  error?: string;
  metadata?: ImageMetadata;
}

/**
 * Image metadata
 */
export interface ImageMetadata {
  originalSize: number;
  convertedSize?: number;
  format: string;
  width: number;
  height: number;
  hasAlpha?: boolean;
  space?: string; // color space
}

/**
 * Format capability definition
 */
export interface FormatCapability {
  from: ImageFormat;
  to: ImageFormat[];
  method: ConversionMethod;
}

/**
 * Category of file formats
 */
export interface FormatCategory {
  client: ImageFormat[];
  server: ImageFormat[];
}

/**
 * Complete format support matrix
 */
export interface FormatSupport {
  formats: {
    image: FormatCategory;
    document?: FormatCategory; // Future: PDF, DOCX, etc.
  };
  conversions: FormatCapability[];
  limits: FileLimits;
}

/**
 * File size and dimension limits
 */
export interface FileLimits {
  maxFileSize: number; // in bytes
  maxDimensions: number; // max width or height
  minDimensions?: number; // min width or height
}

/**
 * API error response
 */
export interface ApiError {
  error: string; // Short error name
  message: string; // Human-readable message
  code: string; // Machine-readable error code
  details?: Record<string, any>; // Additional context
}

/**
 * Health check status
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    sharp: boolean;
    fileSystem: boolean;
  };
  version: string;
}

/**
 * File validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * MIME type to format mapping
 */
export interface MimeTypeMap {
  [key: string]: ImageFormat;
}

/**
 * File magic bytes (signature) for format detection
 */
export interface FileMagicBytes {
  format: ImageFormat;
  signature: number[];
  offset?: number;
}

/**
 * Conversion progress (for future async operations)
 */
export interface ConversionProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  error?: string;
  resultUrl?: string;
}

/**
 * Server-side conversion request (from API endpoint)
 */
export interface ServerConversionRequest {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  options: ConversionOptions;
}

/**
 * Client-side conversion request
 */
export interface ClientConversionRequest {
  file: File;
  options: ConversionOptions;
}

/**
 * Error codes enum
 */
export enum ErrorCode {
  // Validation errors (4xx)
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_TOO_SMALL = 'FILE_TOO_SMALL',
  INVALID_FORMAT = 'INVALID_FORMAT',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  INVALID_DIMENSIONS = 'INVALID_DIMENSIONS',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  INVALID_QUALITY = 'INVALID_QUALITY',

  // Processing errors (422)
  CONVERSION_FAILED = 'CONVERSION_FAILED',
  CORRUPTED_FILE = 'CORRUPTED_FILE',
  UNSUPPORTED_OPERATION = 'UNSUPPORTED_OPERATION',
  DIMENSION_LIMIT_EXCEEDED = 'DIMENSION_LIMIT_EXCEEDED',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SHARP_ERROR = 'SHARP_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  OUT_OF_MEMORY = 'OUT_OF_MEMORY',
}

/**
 * HTTP status codes
 */
export enum HttpStatus {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  PAYLOAD_TOO_LARGE = 413,
  UNSUPPORTED_MEDIA_TYPE = 415,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

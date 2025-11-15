/**
 * POST /api/convert
 * Main file conversion endpoint (server-side using Sharp)
 */

import type { APIRoute } from 'astro';
import type { ImageFormat } from '../../lib/types';
import { ErrorCode } from '../../lib/types';
import { convertImageServer } from '../../lib/server-converter';
import { validateBuffer, validateConversionParameters } from '../../lib/validator';
import {
  createApiError,
  getHttpStatusFromErrorCode,
  generateOutputFilename,
  parseFormField,
  parseNumericField,
  parseBooleanField,
  logError,
} from '../../lib/utils';
import {
  getMimeType,
  getFormatFromMime,
  normalizeFormat,
  DEFAULT_QUALITY,
} from '../../lib/formats';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse multipart form data
    const formData = await request.formData();

    // Extract file
    const file = formData.get('file') as File | null;
    if (!file) {
      const error = createApiError(
        'Missing file',
        'No file was provided in the request',
        ErrorCode.MISSING_PARAMETER,
      );
      return new Response(JSON.stringify(error), {
        status: getHttpStatusFromErrorCode(ErrorCode.MISSING_PARAMETER),
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract parameters
    const outputFormatRaw = parseFormField(
      formData.get('outputFormat') as string | null,
    );
    const quality = parseNumericField(
      formData.get('quality') as string | null,
      DEFAULT_QUALITY,
    );
    const width = parseNumericField(formData.get('width') as string | null);
    const height = parseNumericField(formData.get('height') as string | null);
    const maintainAspect = parseBooleanField(
      formData.get('maintainAspect') as string | null,
      true,
    );

    // Validate output format
    if (!outputFormatRaw) {
      const error = createApiError(
        'Missing output format',
        'Output format parameter is required',
        ErrorCode.MISSING_PARAMETER,
      );
      return new Response(JSON.stringify(error), {
        status: getHttpStatusFromErrorCode(ErrorCode.MISSING_PARAMETER),
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const outputFormat = normalizeFormat(outputFormatRaw);

    // Detect input format from file
    const inputFormat = getFormatFromMime(file.type);
    if (!inputFormat) {
      const error = createApiError(
        'Invalid file type',
        'Could not determine file format',
        ErrorCode.INVALID_FILE_TYPE,
        { mimeType: file.type },
      );
      return new Response(JSON.stringify(error), {
        status: getHttpStatusFromErrorCode(ErrorCode.INVALID_FILE_TYPE),
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate buffer
    const bufferValidation = await validateBuffer(buffer, file.type);
    if (!bufferValidation.valid) {
      const error = createApiError(
        bufferValidation.error || 'Validation failed',
        bufferValidation.error || 'File validation failed',
        bufferValidation.code as ErrorCode,
        bufferValidation.details,
      );
      return new Response(JSON.stringify(error), {
        status: getHttpStatusFromErrorCode(bufferValidation.code as ErrorCode),
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate conversion parameters
    const paramsValidation = validateConversionParameters({
      inputFormat,
      outputFormat: outputFormat as ImageFormat,
      quality,
      width,
      height,
    });

    if (!paramsValidation.valid) {
      const error = createApiError(
        paramsValidation.error || 'Invalid parameters',
        paramsValidation.error || 'Conversion parameters validation failed',
        paramsValidation.code as ErrorCode,
        paramsValidation.details,
      );
      return new Response(JSON.stringify(error), {
        status: getHttpStatusFromErrorCode(paramsValidation.code as ErrorCode),
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Perform conversion
    const conversionResult = await convertImageServer(buffer, {
      outputFormat: outputFormat as ImageFormat,
      quality,
      width,
      height,
      fit: maintainAspect ? 'inside' : 'fill',
    });

    if (!conversionResult.success || !conversionResult.data) {
      const error = createApiError(
        'Conversion failed',
        conversionResult.error || 'Failed to convert image',
        ErrorCode.CONVERSION_FAILED,
      );
      return new Response(JSON.stringify(error), {
        status: getHttpStatusFromErrorCode(ErrorCode.CONVERSION_FAILED),
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate output filename
    const outputFilename = generateOutputFilename(file.name, outputFormat as ImageFormat);

    // Get MIME type for output
    const outputMimeType = getMimeType(outputFormat as ImageFormat);

    // Return converted file
    const convertedBuffer =
      conversionResult.data instanceof Buffer
        ? conversionResult.data
        : Buffer.from(conversionResult.data);

    return new Response(convertedBuffer, {
      status: 200,
      headers: {
        'Content-Type': outputMimeType,
        'Content-Disposition': `attachment; filename="${outputFilename}"`,
        'Content-Length': convertedBuffer.length.toString(),
        'X-Original-Size': file.size.toString(),
        'X-Converted-Size': convertedBuffer.length.toString(),
        'X-Compression-Ratio': (
          (1 - convertedBuffer.length / file.size) *
          100
        ).toFixed(2),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/convert' });

    const apiError = createApiError(
      'Internal Server Error',
      'An unexpected error occurred during conversion',
      ErrorCode.INTERNAL_ERROR,
    );

    return new Response(JSON.stringify(apiError), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// OPTIONS handler for CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

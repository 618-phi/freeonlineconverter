/**
 * Client-side image conversion using Canvas API
 * Runs in the browser, no server-side processing required
 */

import type { ConversionOptions, ConversionResult, ImageFormat } from './types';
import { ErrorCode } from './types';
import { getMimeType, supportsQuality, normalizeFormat } from './formats';
import { DEFAULT_QUALITY } from './formats';
import { clampQuality } from './utils';

/**
 * Convert image using Canvas API (client-side)
 */
export async function convertImageClient(
  file: File,
  options: ConversionOptions,
): Promise<ConversionResult> {
  try {
    // Normalize format
    const outputFormat = normalizeFormat(options.outputFormat);

    // Load image
    const img = await loadImage(file);

    // Get original dimensions
    const originalWidth = img.width;
    const originalHeight = img.height;

    // Calculate target dimensions
    const { width, height } = calculateTargetDimensions(
      originalWidth,
      originalHeight,
      options.width,
      options.height,
    );

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    // Draw image on canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Use high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw the image
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to target format
    const blob = await canvasToBlob(canvas, outputFormat, options.quality);

    if (!blob) {
      throw new Error('Failed to convert image');
    }

    // Create metadata
    const metadata = {
      originalSize: file.size,
      convertedSize: blob.size,
      format: outputFormat,
      width,
      height,
    };

    return {
      success: true,
      data: blob,
      metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Conversion failed',
    };
  }
}

/**
 * Load image from File object
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Convert canvas to Blob
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const mimeType = getMimeType(format);
    const useQuality = supportsQuality(format) && quality !== undefined;
    const qualityValue = useQuality
      ? clampQuality(quality!) / 100
      : DEFAULT_QUALITY / 100;

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      mimeType,
      qualityValue,
    );
  });
}

/**
 * Calculate target dimensions maintaining aspect ratio
 */
function calculateTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number,
): { width: number; height: number } {
  // If no dimensions specified, use original
  if (!targetWidth && !targetHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  // Only width specified
  if (targetWidth && !targetHeight) {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio),
    };
  }

  // Only height specified
  if (targetHeight && !targetWidth) {
    return {
      width: Math.round(targetHeight * aspectRatio),
      height: targetHeight,
    };
  }

  // Both specified - maintain aspect ratio, fit within bounds
  if (targetWidth && targetHeight) {
    const targetAspectRatio = targetWidth / targetHeight;

    if (aspectRatio > targetAspectRatio) {
      // Width is limiting factor
      return {
        width: targetWidth,
        height: Math.round(targetWidth / aspectRatio),
      };
    } else {
      // Height is limiting factor
      return {
        width: Math.round(targetHeight * aspectRatio),
        height: targetHeight,
      };
    }
  }

  return { width: originalWidth, height: originalHeight };
}

/**
 * Convert and download file (convenience function)
 */
export async function convertAndDownload(
  file: File,
  options: ConversionOptions,
  outputFilename: string,
): Promise<void> {
  const result = await convertImageClient(file, options);

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Conversion failed');
  }

  // Create download link
  const blob = result.data instanceof Blob ? result.data : new Blob([result.data]);
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = outputFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Check if client-side conversion is supported for this format
 */
export function isClientConversionSupported(
  inputFormat: ImageFormat,
  outputFormat: ImageFormat,
): boolean {
  // Canvas API supports these formats
  const clientFormats: ImageFormat[] = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

  return (
    clientFormats.includes(inputFormat) && clientFormats.includes(outputFormat)
  );
}

/**
 * Get image dimensions from File without loading entire image
 */
export async function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  const img = await loadImage(file);
  return {
    width: img.width,
    height: img.height,
  };
}

/**
 * Resize image maintaining aspect ratio (client-side)
 */
export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
): Promise<Blob> {
  const img = await loadImage(file);
  const { width, height } = calculateTargetDimensions(
    img.width,
    img.height,
    maxWidth,
    maxHeight,
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, 'png', 100);
  if (!blob) {
    throw new Error('Failed to resize image');
  }

  return blob;
}

/**
 * Convert image to data URL (for preview)
 */
export async function imageToDataURL(
  file: File,
  format: ImageFormat = 'png',
  quality?: number,
): Promise<string> {
  const img = await loadImage(file);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.drawImage(img, 0, 0);

  const mimeType = getMimeType(format);
  const qualityValue = quality !== undefined ? quality / 100 : 0.92;

  return canvas.toDataURL(mimeType, qualityValue);
}

/**
 * Batch convert multiple files
 */
export async function batchConvertImages(
  files: File[],
  options: ConversionOptions,
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = [];

  for (const file of files) {
    const result = await convertImageClient(file, options);
    results.push(result);
  }

  return results;
}

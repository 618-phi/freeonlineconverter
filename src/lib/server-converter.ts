/**
 * Server-side image conversion using Sharp library
 * Runs in Node.js serverless functions
 */

import sharp from 'sharp';
import type {
  ConversionOptions,
  ConversionResult,
  ImageFormat,
  ImageMetadata,
} from './types';
import { ErrorCode } from './types';
import { DEFAULT_QUALITY, supportsQuality, normalizeFormat } from './formats';
import { clampQuality, logError } from './utils';

/**
 * Convert image using Sharp (server-side)
 */
export async function convertImageServer(
  buffer: Buffer,
  options: ConversionOptions,
): Promise<ConversionResult> {
  try {
    // Normalize format
    const outputFormat = normalizeFormat(options.outputFormat);

    // Get original metadata
    const originalMetadata = await extractMetadata(buffer);

    // Create Sharp instance
    let image = sharp(buffer, {
      failOnError: false,
      sequentialRead: true,
      limitInputPixels: 268402689, // 16384 x 16384
    });

    // Resize if dimensions are specified
    if (options.width || options.height) {
      image = image.resize({
        width: options.width,
        height: options.height,
        fit: options.fit || 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to target format with options
    image = applyFormatConversion(image, outputFormat, options.quality);

    // Execute conversion
    const convertedBuffer = await image.toBuffer();

    // Get converted metadata
    const convertedMetadata = await extractMetadata(convertedBuffer);

    // Create result metadata
    const metadata: ImageMetadata = {
      originalSize: buffer.length,
      convertedSize: convertedBuffer.length,
      format: outputFormat,
      width: convertedMetadata.width,
      height: convertedMetadata.height,
      hasAlpha: convertedMetadata.hasAlpha,
      space: convertedMetadata.space,
    };

    return {
      success: true,
      data: convertedBuffer,
      metadata,
    };
  } catch (error) {
    logError(error, { operation: 'convertImageServer' });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Conversion failed',
    };
  }
}

/**
 * Apply format conversion with Sharp
 */
function applyFormatConversion(
  image: sharp.Sharp,
  format: ImageFormat,
  quality?: number,
): sharp.Sharp {
  const useQuality = supportsQuality(format);
  const qualityValue = useQuality && quality ? clampQuality(quality) : DEFAULT_QUALITY;

  switch (format) {
    case 'jpg':
    case 'jpeg':
      return image.jpeg({
        quality: qualityValue,
        mozjpeg: true, // Use MozJPEG for better compression
      });

    case 'png':
      return image.png({
        compressionLevel: 9,
        adaptiveFiltering: true,
      });

    case 'webp':
      return image.webp({
        quality: qualityValue,
        effort: 6, // Compression effort (0-6, higher is slower but better)
      });

    case 'avif':
      return image.avif({
        quality: qualityValue,
        effort: 4, // Compression effort (0-9)
      });

    case 'tiff':
      return image.tiff({
        compression: 'lzw',
      });

    case 'gif':
      return image.gif();

    case 'bmp':
      // Convert to PNG first, then to BMP (Sharp doesn't directly support BMP output)
      return image.png();

    default:
      return image;
  }
}

/**
 * Extract image metadata
 */
export async function extractMetadata(buffer: Buffer): Promise<ImageMetadata> {
  try {
    const metadata = await sharp(buffer).metadata();

    return {
      originalSize: buffer.length,
      format: metadata.format || 'unknown',
      width: metadata.width || 0,
      height: metadata.height || 0,
      hasAlpha: metadata.hasAlpha,
      space: metadata.space,
    };
  } catch (error) {
    logError(error, { operation: 'extractMetadata' });
    throw new Error('Failed to extract image metadata');
  }
}

/**
 * Resize image with Sharp
 */
export async function resizeImageServer(
  buffer: Buffer,
  width?: number,
  height?: number,
  fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside' = 'inside',
): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize({
        width,
        height,
        fit,
        withoutEnlargement: true,
      })
      .toBuffer();
  } catch (error) {
    logError(error, { operation: 'resizeImageServer' });
    throw new Error('Failed to resize image');
  }
}

/**
 * Optimize image (reduce file size without changing format)
 */
export async function optimizeImage(
  buffer: Buffer,
  format: ImageFormat,
  quality: number = DEFAULT_QUALITY,
): Promise<Buffer> {
  try {
    const image = sharp(buffer);
    const optimized = applyFormatConversion(image, format, quality);
    return await optimized.toBuffer();
  } catch (error) {
    logError(error, { operation: 'optimizeImage' });
    throw new Error('Failed to optimize image');
  }
}

/**
 * Create thumbnail
 */
export async function createThumbnail(
  buffer: Buffer,
  size: number = 200,
): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (error) {
    logError(error, { operation: 'createThumbnail' });
    throw new Error('Failed to create thumbnail');
  }
}

/**
 * Rotate image
 */
export async function rotateImage(
  buffer: Buffer,
  angle: number,
): Promise<Buffer> {
  try {
    return await sharp(buffer).rotate(angle).toBuffer();
  } catch (error) {
    logError(error, { operation: 'rotateImage' });
    throw new Error('Failed to rotate image');
  }
}

/**
 * Auto-orient image based on EXIF data
 */
export async function autoOrientImage(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer).rotate().toBuffer();
  } catch (error) {
    logError(error, { operation: 'autoOrientImage' });
    throw new Error('Failed to auto-orient image');
  }
}

/**
 * Convert with advanced options
 */
export async function convertWithAdvancedOptions(
  buffer: Buffer,
  options: {
    format: ImageFormat;
    quality?: number;
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    rotate?: number;
    flip?: boolean;
    flop?: boolean;
    grayscale?: boolean;
    blur?: number;
    sharpen?: boolean;
  },
): Promise<Buffer> {
  try {
    let image = sharp(buffer, {
      failOnError: false,
      sequentialRead: true,
    });

    // Apply transformations
    if (options.rotate) {
      image = image.rotate(options.rotate);
    }

    if (options.flip) {
      image = image.flip();
    }

    if (options.flop) {
      image = image.flop();
    }

    if (options.grayscale) {
      image = image.grayscale();
    }

    if (options.blur !== undefined && options.blur > 0) {
      image = image.blur(options.blur);
    }

    if (options.sharpen) {
      image = image.sharpen();
    }

    // Resize
    if (options.width || options.height) {
      image = image.resize({
        width: options.width,
        height: options.height,
        fit: options.fit || 'inside',
        withoutEnlargement: true,
      });
    }

    // Format conversion
    image = applyFormatConversion(image, options.format, options.quality);

    return await image.toBuffer();
  } catch (error) {
    logError(error, { operation: 'convertWithAdvancedOptions' });
    throw new Error('Failed to convert image with advanced options');
  }
}

/**
 * Validate Sharp is available
 */
export function isSharpAvailable(): boolean {
  try {
    // Try to create a Sharp instance
    sharp(Buffer.from([0xff, 0xd8, 0xff]));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get Sharp version
 */
export function getSharpVersion(): string {
  try {
    return sharp.versions.sharp || 'unknown';
  } catch (error) {
    return 'unavailable';
  }
}

/**
 * Batch convert multiple buffers
 */
export async function batchConvertBuffers(
  buffers: Buffer[],
  options: ConversionOptions,
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = [];

  for (const buffer of buffers) {
    const result = await convertImageServer(buffer, options);
    results.push(result);
  }

  return results;
}

/**
 * Stream conversion (for large files)
 */
export function createConversionStream(
  options: ConversionOptions,
): sharp.Sharp {
  const outputFormat = normalizeFormat(options.outputFormat);
  const quality = options.quality || DEFAULT_QUALITY;

  let image = sharp({
    failOnError: false,
    sequentialRead: true,
  });

  if (options.width || options.height) {
    image = image.resize({
      width: options.width,
      height: options.height,
      fit: options.fit || 'inside',
      withoutEnlargement: true,
    });
  }

  image = applyFormatConversion(image, outputFormat, quality);

  return image;
}

/**
 * GET /api/health
 * Health check endpoint
 */

import type { APIRoute } from 'astro';
import type { HealthStatus } from '../../lib/types';
import { isSharpAvailable, getSharpVersion } from '../../lib/server-converter';
import { getCurrentTimestamp } from '../../lib/utils';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export const GET: APIRoute = async () => {
  try {
    // Check Sharp availability
    const sharpAvailable = isSharpAvailable();

    // Check file system access
    let fileSystemAvailable = false;
    try {
      const testFile = join(tmpdir(), `health-check-${Date.now()}.tmp`);
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      fileSystemAvailable = true;
    } catch (error) {
      fileSystemAvailable = false;
    }

    // Determine overall health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (!sharpAvailable) {
      status = 'unhealthy';
    } else if (!fileSystemAvailable) {
      status = 'degraded';
    }

    const healthStatus: HealthStatus = {
      status,
      timestamp: getCurrentTimestamp(),
      services: {
        sharp: sharpAvailable,
        fileSystem: fileSystemAvailable,
      },
      version: '1.0.0',
    };

    const httpStatus = status === 'healthy' ? 200 : 503;

    return new Response(JSON.stringify(healthStatus, null, 2), {
      status: httpStatus,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    const healthStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: getCurrentTimestamp(),
      services: {
        sharp: false,
        fileSystem: false,
      },
      version: '1.0.0',
    };

    return new Response(JSON.stringify(healthStatus, null, 2), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  }
};

// OPTIONS handler for CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

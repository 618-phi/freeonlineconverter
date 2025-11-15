/**
 * GET /api/formats
 * Returns supported format conversions and capabilities
 */

import type { APIRoute } from 'astro';
import { getFormatSupport } from '../../lib/formats';

export const GET: APIRoute = async ({ request }) => {
  try {
    const formatSupport = getFormatSupport();

    return new Response(JSON.stringify(formatSupport, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to retrieve format information',
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
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

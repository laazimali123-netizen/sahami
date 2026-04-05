// ═══════════════════════════════════════════════════════════
// SAHAMI - Auth: Get current session
// GET /api/auth/session
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { parseSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = parseSession(request.headers.get('cookie'));

  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ session }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

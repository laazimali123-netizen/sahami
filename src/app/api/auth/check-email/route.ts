// ═══════════════════════════════════════════════════════════
// SAHAMI - Auth: Check Email Availability
// POST /api/auth/check-email
// Returns whether an email is available for registration
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail.length < 3 || !normalizedEmail.includes('@')) {
      return new Response(JSON.stringify({ available: false, error: 'Invalid email format' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    return new Response(JSON.stringify({
      available: !existingUser,
      email: normalizedEmail,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Email check error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

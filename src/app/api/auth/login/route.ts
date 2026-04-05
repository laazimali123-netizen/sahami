// ═══════════════════════════════════════════════════════════
// SAHAMI - Auth: Login
// POST /api/auth/login
// Authenticates user and sets session cookie
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, getSessionCookie, authenticateRequest, getClearSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find user with school relation
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { school: true },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!user.isActive) {
      return new Response(JSON.stringify({ error: 'Account is deactivated. Contact administrator.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build session data
    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
      schoolName: user.school?.name || null,
      schoolPlan: user.school?.plan || null,
    };

    // Set session cookie and return
    return new Response(JSON.stringify({
      success: true,
      session: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        schoolName: user.school?.name || null,
        schoolPlan: user.school?.plan || null,
      },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': getSessionCookie(session as any),
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Handle logout via GET
export async function GET(request: NextRequest) {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': getClearSessionCookie(),
    },
  });
}

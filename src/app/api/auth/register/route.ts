// ═══════════════════════════════════════════════════════════
// SAHAMI - Auth: Register (create new school + owner account)
// POST /api/auth/register
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, getSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      schoolName,
      schoolEmail,
      managerName,
      managerEmail,
      email,
      password,
      plan,
    } = body;

    // Accept either 'email' (from frontend form) or 'managerEmail'
    const finalEmail = (managerEmail || email || '').toLowerCase().trim();

    // Validate required fields
    if (!schoolName || !schoolName.trim()) {
      return new Response(JSON.stringify({ error: 'School name is required. Please enter a name for your school.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!managerName || !managerName.trim()) {
      return new Response(JSON.stringify({ error: 'Your full name is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!finalEmail) {
      return new Response(JSON.stringify({ error: 'Email address is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Basic email validation
    if (!finalEmail.includes('@') || !finalEmail.includes('.')) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address (e.g., admin@school.com).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!password) {
      return new Response(JSON.stringify({ error: 'Password is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters long.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if email already exists - with helpful error message
    const existingUser = await db.user.findUnique({
      where: { email: finalEmail },
    });

    if (existingUser) {
      return new Response(JSON.stringify({
        error: `This email (${finalEmail}) is already registered. Please sign in to your existing account, or use a different email address to register a new school.`,
        field: 'email',
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create school with 30-day free trial
    const school = await db.school.create({
      data: {
        name: schoolName.trim(),
        email: schoolEmail || null,
        plan: plan || 'BASIC',
        maxStudents: plan === 'PRO' ? 500 : 100,
        maxTeachers: plan === 'PRO' ? 50 : 20,
        trialStart: new Date(),
      },
    });

    // Create OWNER user (the school creator is always the owner)
    const user = await db.user.create({
      data: {
        email: finalEmail,
        password: hashedPassword,
        name: managerName.trim(),
        role: 'OWNER',
        schoolId: school.id,
      },
    });

    // Build session
    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: school.id,
      schoolName: school.name,
      schoolPlan: school.plan,
      trialStart: school.trialStart ? (school.trialStart instanceof Date ? school.trialStart.toISOString() : String(school.trialStart)) : null,
    };

    return new Response(JSON.stringify({
      success: true,
      message: `School "${school.name}" created! You are the owner.`,
      session: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: school.id,
        schoolName: school.name,
        schoolPlan: school.plan,
        trialStart: school.trialStart ? (school.trialStart instanceof Date ? school.trialStart.toISOString() : String(school.trialStart)) : null,
      },
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': getSessionCookie(session as any),
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      return new Response(JSON.stringify({
        error: 'This email is already taken. Please use a different email address.',
        field: 'email',
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Internal server error. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

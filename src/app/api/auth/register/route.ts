// ═══════════════════════════════════════════════════════════
// SAHAMI - Auth: Register (create new school + manager account)
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
      password,
      plan,
    } = body;

    // Validate required fields
    if (!schoolName || !managerName || !managerEmail || !password) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: managerEmail.toLowerCase().trim() },
    });

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'An account with this email already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create school
    const school = await db.school.create({
      data: {
        name: schoolName,
        email: schoolEmail || null,
        plan: plan || 'BASIC',
        maxStudents: plan === 'PRO' ? 500 : 100,
        maxTeachers: plan === 'PRO' ? 50 : 20,
      },
    });

    // Create manager user
    const user = await db.user.create({
      data: {
        email: managerEmail.toLowerCase().trim(),
        password: hashedPassword,
        name: managerName,
        role: 'MANAGER',
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
    };

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: school.id,
        schoolName: school.name,
        schoolPlan: school.plan,
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
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

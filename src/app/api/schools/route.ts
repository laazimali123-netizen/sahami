// ═══════════════════════════════════════════════════════════
// SAHAMI - Schools API (SUPER_ADMIN only)
// GET    /api/schools - List all schools
// POST   /api/schools - Create new school + OWNER
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;

  if (auth.session.role !== 'SUPER_ADMIN') {
    return new Response(JSON.stringify({ error: 'Super admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const schools = await db.school.findMany({
    include: {
      _count: {
        select: { students: true, users: true, classes: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return new Response(JSON.stringify({ schools }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;

  if (auth.session.role !== 'SUPER_ADMIN') {
    return new Response(JSON.stringify({ error: 'Super admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { name, email, phone, plan, managerName, managerEmail, managerPassword, managerRole } = body;

    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: 'School name is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!managerName || !managerName.trim()) {
      return new Response(JSON.stringify({ error: 'Manager/Owner name is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!managerEmail || !managerEmail.trim()) {
      return new Response(JSON.stringify({ error: 'Manager/Owner email is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!managerPassword || managerPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const normalizedEmail = managerEmail.toLowerCase().trim();

    // Check for duplicate email
    const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return new Response(JSON.stringify({
        error: `The email "${normalizedEmail}" is already registered to "${existing.name}" (${existing.role}). Please use a different email.`,
        field: 'email',
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hashedPassword = await hashPassword(managerPassword);

    // Create school
    const school = await db.school.create({
      data: {
        name: name.trim(),
        email: email || null,
        phone: phone || null,
        plan: plan || 'BASIC',
        maxStudents: plan === 'PRO' ? 500 : 100,
        maxTeachers: plan === 'PRO' ? 50 : 20,
      },
    });

    // Create user - default to OWNER (school creator is always the owner)
    const userRole = managerRole === 'MANAGER' ? 'MANAGER' : 'OWNER';
    await db.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: managerName.trim(),
        role: userRole,
        schoolId: school.id,
      },
    });

    return new Response(JSON.stringify({
      school,
      message: `School "${school.name}" created! ${managerName} is the ${userRole}.`,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Create school error:', error);

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

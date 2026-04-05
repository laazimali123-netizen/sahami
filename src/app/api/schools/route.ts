// ═══════════════════════════════════════════════════════════
// SAHAMI - Schools API (SUPER_ADMIN only)
// GET    /api/schools - List all schools
// POST   /api/schools - Create new school
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
    const { name, email, phone, plan, managerName, managerEmail, managerPassword } = body;

    if (!name || !managerName || !managerEmail || !managerPassword) {
      return new Response(JSON.stringify({ error: 'Required fields missing' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hashedPassword = await hashPassword(managerPassword);

    const school = await db.school.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        plan: plan || 'BASIC',
        maxStudents: plan === 'PRO' ? 500 : 100,
        maxTeachers: plan === 'PRO' ? 50 : 20,
      },
    });

    await db.user.create({
      data: {
        email: managerEmail.toLowerCase().trim(),
        password: hashedPassword,
        name: managerName,
        role: 'MANAGER',
        schoolId: school.id,
      },
    });

    return new Response(JSON.stringify({ school }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Create school error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

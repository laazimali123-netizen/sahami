// ═══════════════════════════════════════════════════════════
// SAHAMI - Admin: List All Users (Super Admin)
// GET /api/admin/users - List all users across all schools
// POST /api/admin/users - Create employee (admin user or school manager)
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

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';
  const schoolId = searchParams.get('schoolId') || '';

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (role) where.role = role;
  if (schoolId) where.schoolId = schoolId;

  const users = await db.user.findMany({
    where,
    include: {
      school: { select: { id: true, name: true, plan: true } },
      _count: { select: { classAssignments: true, grades: true, attendanceMarks: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Also get counts by role
  const totalUsers = await db.user.count();
  const totalAdmins = await db.user.count({ where: { role: 'SUPER_ADMIN' } });
  const totalManagers = await db.user.count({ where: { role: 'MANAGER' } });
  const totalTeachers = await db.user.count({ where: { role: 'TEACHER' } });

  return new Response(JSON.stringify({
    users,
    counts: { total: totalUsers, admins: totalAdmins, managers: totalManagers, teachers: totalTeachers },
  }), {
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
    const { name, email, password, role, schoolId } = body;

    if (!name || !email || !password || !role) {
      return new Response(JSON.stringify({ error: 'Name, email, password, and role are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate role
    if (!['SUPER_ADMIN', 'MANAGER', 'TEACHER'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if email exists
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return new Response(JSON.stringify({ error: 'Email already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        schoolId: schoolId || null,
      },
      include: {
        school: { select: { id: true, name: true } },
      },
    });

    return new Response(JSON.stringify({ user }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Create employee error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ═══════════════════════════════════════════════════════════
// SAHAMI - Admin: List All Users (Super Admin)
// GET /api/admin/users - List all users across all schools
// POST /api/admin/users - Create employee
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, hashPassword } from '@/lib/auth';

const VALID_ROLES = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'TEACHER', 'FINANCE'];

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

  // Role counts
  const totalUsers = await db.user.count();
  const totalAdmins = await db.user.count({ where: { role: 'SUPER_ADMIN' } });
  const totalOwners = await db.user.count({ where: { role: 'OWNER' } });
  const totalManagers = await db.user.count({ where: { role: 'MANAGER' } });
  const totalTeachers = await db.user.count({ where: { role: 'TEACHER' } });
  const totalFinance = await db.user.count({ where: { role: 'FINANCE' } });

  return new Response(JSON.stringify({
    users,
    counts: {
      total: totalUsers,
      admins: totalAdmins,
      owners: totalOwners,
      managers: totalManagers,
      teachers: totalTeachers,
      finance: totalFinance,
    },
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

    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: 'Name is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!email || !email.trim()) {
      return new Response(JSON.stringify({ error: 'Email is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!password || password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!role || !VALID_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email exists
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return new Response(JSON.stringify({
        error: `The email "${normalizedEmail}" is already registered to "${existing.name}" (${existing.role}). Please use a different email address.`,
        field: 'email',
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate school assignment
    if (schoolId && schoolId !== 'none') {
      const schoolExists = await db.school.findUnique({ where: { id: schoolId } });
      if (!schoolExists) {
        return new Response(JSON.stringify({ error: 'Selected school not found.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const hashedPassword = await hashPassword(password);

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
        schoolId: (schoolId && schoolId !== 'none') ? schoolId : null,
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

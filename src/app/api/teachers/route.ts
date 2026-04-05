// ═══════════════════════════════════════════════════════════
// SAHAMI - Teachers API
// GET    /api/teachers - List all teachers
// POST   /api/teachers - Create new teacher (manager only)
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  if (!session.schoolId) {
    return new Response(JSON.stringify({ error: 'No school assigned' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  const where: any = { schoolId: session.schoolId, role: 'TEACHER' };

  // TEACHER role: only see themselves
  if (session.role === 'TEACHER') {
    where.id = session.userId;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const teachers = await db.user.findMany({
    where,
    include: {
      classAssignments: {
        include: { class: { select: { id: true, name: true } } },
      },
      _count: {
        select: { classAssignments: true, grades: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return new Response(JSON.stringify({ teachers }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  if (!['OWNER', 'MANAGER'].includes(session.role)) {
    return new Response(JSON.stringify({ error: 'Only owners and managers can create teachers' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { name, email, phone, password, classIds } = body;

    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: 'Name, email, and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check teacher limit
    const teacherCount = await db.user.count({
      where: { schoolId: session.schoolId, role: 'TEACHER' },
    });
    const school = await db.school.findUnique({ where: { id: session.schoolId! } });
    if (school && teacherCount >= school.maxTeachers) {
      return new Response(JSON.stringify({
        error: `Teacher limit reached (${school.maxTeachers}). Upgrade your plan.`
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hashedPassword = await hashPassword(password);

    const teacher = await db.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone || null,
        role: 'TEACHER',
        schoolId: session.schoolId,
        ...(classIds && classIds.length > 0 ? {
          classAssignments: {
            create: classIds.map((classId: string) => ({
              classId,
              schoolId: session.schoolId!,
            })),
          },
        } : {}),
      },
      include: {
        classAssignments: { include: { class: true } },
        _count: { select: { classAssignments: true, grades: true } },
      },
    });

    return new Response(JSON.stringify({ teacher }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Create teacher error:', error);
    if (error.code === 'P2002') {
      return new Response(JSON.stringify({ error: 'A user with this email already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

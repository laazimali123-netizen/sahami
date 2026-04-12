// ═══════════════════════════════════════════════════════════
// SAHAMI - Classes API
// GET    /api/classes - List all classes
// POST   /api/classes - Create new class
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

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

  const classes = await db.schoolClass.findMany({
    where: { schoolId: session.schoolId },
    include: {
      _count: {
        select: { enrollments: true, teachers: true },
      },
      classSubjects: {
        include: { subject: { select: { id: true, name: true, code: true } } },
      },
    },
    orderBy: [{ gradeLevel: 'asc' }, { section: 'asc' }],
  });

  return new Response(JSON.stringify({ classes }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  if (!['OWNER', 'MANAGER'].includes(session.role)) {
    return new Response(JSON.stringify({ error: 'Only owners and managers can create classes' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { name, gradeLevel, section, room, capacity, subjectIds } = body;

    if (!name || !gradeLevel || !section) {
      return new Response(JSON.stringify({ error: 'Name, grade level, and section are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cls = await db.schoolClass.create({
      data: {
        name,
        gradeLevel: String(gradeLevel),
        section,
        room: room || null,
        capacity: capacity || 30,
        schoolId: session.schoolId!,
        ...(subjectIds && subjectIds.length > 0 ? {
          classSubjects: {
            create: subjectIds.map((subjectId: string) => ({ subjectId })),
          },
        } : {}),
      },
      include: {
        _count: { select: { enrollments: true, teachers: true } },
        classSubjects: { include: { subject: true } },
      },
    });

    return new Response(JSON.stringify({ class: cls }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Create class error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

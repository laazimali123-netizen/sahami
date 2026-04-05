// ═══════════════════════════════════════════════════════════
// SAHAMI - Class Detail API
// GET    /api/classes/[id] - Get class with enrolled students & teachers
// PUT    /api/classes/[id] - Update class
// DELETE /api/classes/[id] - Archive class
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;
  const { id } = await params;

  const cls = await db.schoolClass.findFirst({
    where: { id, schoolId: session.schoolId },
    include: {
      enrollments: {
        where: { status: 'ACTIVE' },
        include: {
          student: {
            select: {
              id: true, studentId: true, firstName: true, lastName: true,
              gender: true, status: true, avatar: true,
            },
          },
        },
      },
      teachers: {
        include: {
          teacher: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      classSubjects: {
        include: { subject: { select: { id: true, name: true, code: true } } },
      },
      timetableSlots: {
        include: {
          subject: { select: { name: true, code: true } },
          teacher: { select: { name: true } },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
    },
  });

  if (!cls) {
    return new Response(JSON.stringify({ error: 'Class not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ class: cls }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;
  const { id } = await params;

  if (session.role !== 'MANAGER') {
    return new Response(JSON.stringify({ error: 'Only managers can update classes' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const cls = await db.schoolClass.update({
      where: { id },
      data: {
        name: body.name,
        gradeLevel: body.gradeLevel,
        section: body.section,
        room: body.room,
        capacity: body.capacity,
      },
      include: {
        _count: { select: { enrollments: true, teachers: true } },
      },
    });

    return new Response(JSON.stringify({ class: cls }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;
  const { id } = await params;

  if (session.role !== 'MANAGER') {
    return new Response(JSON.stringify({ error: 'Only managers can delete classes' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Delete class and all related records
  await db.enrollment.deleteMany({ where: { classId: id } });
  await db.classTeacher.deleteMany({ where: { classId: id } });
  await db.classSubject.deleteMany({ where: { classId: id } });
  await db.timetableSlot.deleteMany({ where: { classId: id } });
  await db.schoolClass.delete({ where: { id } });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

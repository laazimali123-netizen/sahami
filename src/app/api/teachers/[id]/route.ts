// ═══════════════════════════════════════════════════════════
// SAHAMI - Teacher Detail API
// GET    /api/teachers/[id] - Get teacher details
// PUT    /api/teachers/[id] - Update teacher
// DELETE /api/teachers/[id] - Deactivate teacher
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

  const teacher = await db.user.findFirst({
    where: { id, schoolId: session.schoolId, role: 'TEACHER' },
    include: {
      classAssignments: {
        include: { class: { select: { id: true, name: true, gradeLevel: true } } },
      },
      grades: {
        include: {
          student: { select: { firstName: true, lastName: true, studentId: true } },
          subject: { select: { name: true, code: true } },
        },
        orderBy: { date: 'desc' },
        take: 20,
      },
      _count: { select: { classAssignments: true, grades: true, attendanceMarks: true } },
    },
  });

  if (!teacher) {
    return new Response(JSON.stringify({ error: 'Teacher not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ teacher }), {
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

  if (!['OWNER', 'MANAGER'].includes(session.role)) {
    return new Response(JSON.stringify({ error: 'Only owners and managers can update teachers' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const teacher = await db.user.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
      include: {
        classAssignments: { include: { class: true } },
        _count: { select: { classAssignments: true, grades: true } },
      },
    });

    return new Response(JSON.stringify({ teacher }), {
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

  if (!['OWNER', 'MANAGER'].includes(session.role)) {
    return new Response(JSON.stringify({ error: 'Only owners and managers can deactivate teachers' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const teacher = await db.user.update({
      where: { id, schoolId: session.schoolId },
      data: { isActive: false },
    });

    return new Response(JSON.stringify({ success: true, teacher }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Teacher not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

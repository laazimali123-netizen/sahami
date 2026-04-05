// ═══════════════════════════════════════════════════════════
// SAHAMI - Student Detail API
// GET    /api/students/[id] - Get student by ID
// PUT    /api/students/[id] - Update student
// DELETE /api/students/[id] - Soft-delete student (set status INACTIVE)
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

  const student = await db.student.findFirst({
    where: { id, schoolId: session.schoolId },
    include: {
      enrollments: { include: { class: true } },
      grades: {
        include: {
          subject: { select: { name: true, code: true } },
          class: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      },
      attendanceRecords: { orderBy: { date: 'desc' }, take: 30 },
      feeRecords: session.schoolPlan === 'PRO' ? {
        include: { payments: true },
        orderBy: { createdAt: 'desc' },
      } : undefined,
    },
  });

  if (!student) {
    return new Response(JSON.stringify({ error: 'Student not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ student }), {
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
    return new Response(JSON.stringify({ error: 'Only managers can update students' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const student = await db.student.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth,
        gender: body.gender,
        address: body.address,
        phone: body.phone,
        email: body.email,
        guardianName: body.guardianName,
        guardianPhone: body.guardianPhone,
        guardianRelation: body.guardianRelation,
        status: body.status,
      },
      include: { enrollments: { include: { class: true } } },
    });

    return new Response(JSON.stringify({ student }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Update student error:', error);
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
    return new Response(JSON.stringify({ error: 'Only managers can delete students' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const student = await db.student.update({
      where: { id, schoolId: session.schoolId },
      data: { status: 'INACTIVE' },
    });

    return new Response(JSON.stringify({ success: true, student }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Student not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

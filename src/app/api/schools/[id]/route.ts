// ═══════════════════════════════════════════════════════════
// SAHAMI - Admin: School Detail API
// GET    /api/schools/[id] - Get school with stats
// PUT    /api/schools/[id] - Update school
// DELETE /api/schools/[id] - Deactivate school
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

  if (auth.session.role !== 'SUPER_ADMIN') {
    return new Response(JSON.stringify({ error: 'Super admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = await params;

  const school = await db.school.findUnique({
    where: { id },
    include: {
      _count: {
        select: { students: true, users: true, classes: true, subjects: true },
      },
      users: {
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!school) {
    return new Response(JSON.stringify({ error: 'School not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get recent activity: latest enrollments and grades
  const recentStudents = await db.student.findMany({
    where: { schoolId: id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, studentId: true, firstName: true, lastName: true, status: true, createdAt: true },
  });

  const feeSummary = await db.feeRecord.aggregate({
    where: { schoolId: id },
    _sum: { amount: true },
  });

  const paidFees = await db.feeRecord.aggregate({
    where: { schoolId: id, status: 'PAID' },
    _sum: { amount: true },
  });

  return new Response(JSON.stringify({
    school,
    recentStudents,
    financial: {
      totalBilled: feeSummary._sum.amount || 0,
      totalCollected: paidFees._sum.amount || 0,
    },
  }), {
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

  if (auth.session.role !== 'SUPER_ADMIN') {
    return new Response(JSON.stringify({ error: 'Super admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, email, phone, plan, isActive, maxStudents, maxTeachers, academicYear } = body;

    const school = await db.school.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(plan && {
          plan,
          maxStudents: plan === 'PRO' ? 500 : 100,
          maxTeachers: plan === 'PRO' ? 50 : 20,
        }),
        ...(isActive !== undefined && { isActive }),
        ...(maxStudents && { maxStudents }),
        ...(maxTeachers && { maxTeachers }),
        ...(academicYear && { academicYear }),
      },
      include: {
        _count: { select: { students: true, users: true, classes: true } },
      },
    });

    return new Response(JSON.stringify({ school }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Update school error:', error);
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

  if (auth.session.role !== 'SUPER_ADMIN') {
    return new Response(JSON.stringify({ error: 'Super admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = await params;

  // Soft-delete: deactivate school
  await db.school.update({
    where: { id },
    data: { isActive: false },
  });

  // Deactivate all users in the school
  await db.user.updateMany({
    where: { schoolId: id },
    data: { isActive: false },
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

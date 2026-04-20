// ═══════════════════════════════════════════════════════════
// SAHAMI - Fees API (PRO TIER ONLY)
// GET    /api/fees - List fee records
// POST   /api/fees - Create fee record
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireProAccess } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  const proCheck = requireProAccess(session);
  if (proCheck) return proCheck;

  if (!session.schoolId) {
    return new Response(JSON.stringify({ error: 'No school assigned' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || '';
  const studentId = searchParams.get('studentId') || '';

  const where: any = { schoolId: session.schoolId };
  if (status) where.status = status;
  if (studentId) where.studentId = studentId;

  const [feeRecords, summary] = await Promise.all([
    db.feeRecord.findMany({
      where,
      include: {
        student: { select: { id: true, studentId: true, firstName: true, lastName: true } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.feeRecord.aggregate({
      where: { schoolId: session.schoolId },
      _sum: { amount: true },
    }),
  ]);

  return new Response(JSON.stringify({
    feeRecords,
    totalExpected: summary._sum.amount || 0,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  const proCheck = requireProAccess(session);
  if (proCheck) return proCheck;

  if (!['OWNER', 'MANAGER'].includes(session.role)) {
    return new Response(JSON.stringify({ error: 'Only owners and managers can create fee records' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!session.schoolId) {
    return new Response(JSON.stringify({ error: 'No school assigned' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { studentId, title, amount, dueDate } = body;

    if (!studentId || !title || !amount) {
      return new Response(JSON.stringify({ error: 'studentId, title, and amount are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fee = await db.feeRecord.create({
      data: {
        studentId,
        title,
        amount: parseFloat(amount),
        dueDate: dueDate || null,
        schoolId: session.schoolId,
      },
      include: {
        student: { select: { firstName: true, lastName: true, studentId: true } },
      },
    });

    return new Response(JSON.stringify({ fee }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

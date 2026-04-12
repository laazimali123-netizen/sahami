// ═══════════════════════════════════════════════════════════
// SAHAMI - Payments API (PRO TIER ONLY)
// POST   /api/payments - Record a payment against a fee
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  if (session.schoolPlan !== 'PRO') {
    return new Response(JSON.stringify({ error: 'Finance module requires PRO plan' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!['OWNER', 'MANAGER'].includes(session.role)) {
    return new Response(JSON.stringify({ error: 'Only owners and managers can record payments' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { feeRecordId, amount, method, reference } = body;

    if (!feeRecordId || !amount || !method) {
      return new Response(JSON.stringify({ error: 'feeRecordId, amount, and method are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify fee record belongs to the same school
    const feeRecord = await db.feeRecord.findFirst({
      where: { id: feeRecordId, schoolId: session.schoolId },
    });

    if (!feeRecord) {
      return new Response(JSON.stringify({ error: 'Fee record not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create payment
    const payment = await db.payment.create({
      data: {
        feeRecordId,
        amount: parseFloat(amount),
        method,
        reference: reference || null,
        receivedBy: session.userId,
        paidAt: new Date().toISOString().split('T')[0],
      },
    });

    // Calculate total paid for this fee record
    const paidResult = await db.payment.aggregate({
      where: { feeRecordId },
      _sum: { amount: true },
    });

    const totalPaid = paidResult._sum.amount || 0;

    // Update fee status
    let newStatus = 'PENDING';
    if (totalPaid >= feeRecord.amount) {
      newStatus = 'PAID';
    } else if (totalPaid > 0) {
      newStatus = 'PENDING';
    }

    // Check if overdue
    if (feeRecord.dueDate && new Date(feeRecord.dueDate) < new Date() && totalPaid < feeRecord.amount) {
      newStatus = 'OVERDUE';
    }

    await db.feeRecord.update({
      where: { id: feeRecordId },
      data: { status: newStatus },
    });

    return new Response(JSON.stringify({ payment, newStatus }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Payment error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

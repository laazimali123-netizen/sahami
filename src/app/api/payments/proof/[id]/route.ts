// ═══════════════════════════════════════════════════════════
// SAHAMI - Payment Proof Review API (SUPER_ADMIN only)
// PUT    /api/payments/proof/[id] - Approve or reject payment proof
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;
  const { id } = await params;

  if (session.role !== 'SUPER_ADMIN') {
    return new Response(JSON.stringify({ error: 'Only super admins can review payment proofs' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { status, adminNotes } = body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Status must be APPROVED or REJECTED' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const proof = await db.paymentProof.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes || null,
        reviewedAt: new Date(),
      },
    });

    // If approved, upgrade the school to PRO and clear trial
    if (status === 'APPROVED') {
      await db.school.update({
        where: { id: proof.schoolId },
        data: {
          plan: proof.plan || 'PRO',
          maxStudents: 500,
          maxTeachers: 50,
          trialStart: null,
        },
      });
    }

    return new Response(JSON.stringify({ proof }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Payment proof review error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

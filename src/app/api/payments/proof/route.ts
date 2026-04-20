// ═══════════════════════════════════════════════════════════
// SAHAMI - Payment Proof API
// POST   /api/payments/proof - Submit payment proof (school user)
// GET    /api/payments/proof - List payment proofs (SUPER_ADMIN only)
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  if (!session.schoolId) {
    return new Response(JSON.stringify({ error: 'No school assigned' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { plan, amount, method, contactInfo, screenshotUrl } = body;

    if (!plan || !amount || !method || !contactInfo) {
      return new Response(JSON.stringify({ error: 'plan, amount, method, and contactInfo are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validMethods = ['EBIRR', 'KAAFII', 'CBE'];
    if (!validMethods.includes(method)) {
      return new Response(JSON.stringify({ error: 'Invalid payment method. Use EBIRR, KAAFII, or CBE.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get school name
    const school = await db.school.findUnique({
      where: { id: session.schoolId },
      select: { name: true },
    });

    const proof = await db.paymentProof.create({
      data: {
        schoolId: session.schoolId,
        schoolName: school?.name || 'Unknown',
        requesterId: session.userId,
        requesterName: session.name,
        plan,
        amount: parseFloat(amount),
        method,
        contactInfo,
        screenshotUrl: screenshotUrl || null,
      },
    });

    return new Response(JSON.stringify({ proof }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Payment proof error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  if (session.role !== 'SUPER_ADMIN') {
    return new Response(JSON.stringify({ error: 'Only super admins can view payment proofs' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || '';

  const where: any = {};
  if (status) where.status = status;

  const proofs = await db.paymentProof.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return new Response(JSON.stringify({ proofs }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

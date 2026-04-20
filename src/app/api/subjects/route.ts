// ═══════════════════════════════════════════════════════════
// SAHAMI - Subjects API
// GET    /api/subjects - List all subjects
// POST   /api/subjects - Create new subject
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireProAccess } from '@/lib/auth';

// NOTE: GET is always allowed — subjects list needed by grades, timetable, etc.
// Only POST (creating subjects) requires PRO.

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  // GET always works — subject list needed by various components.
  if (!session.schoolId) {
    return new Response(JSON.stringify({ error: 'No school assigned' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const subjects = await db.subject.findMany({
    where: { schoolId: session.schoolId },
    include: {
      _count: { select: { grades: true, classSubjects: true } },
    },
    orderBy: { name: 'asc' },
  });

  return new Response(JSON.stringify({ subjects }), {
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

  if (!session.schoolId) {
    return new Response(JSON.stringify({ error: 'No school assigned' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!['OWNER', 'MANAGER'].includes(session.role)) {
    return new Response(JSON.stringify({ error: 'Only owners and managers can create subjects' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { name, code, description } = body;

    if (!name || !code) {
      return new Response(JSON.stringify({ error: 'Name and code are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const subject = await db.subject.create({
      data: {
        name,
        code: code.toUpperCase(),
        description: description || null,
        schoolId: session.schoolId,
      },
    });

    return new Response(JSON.stringify({ subject }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return new Response(JSON.stringify({ error: 'Subject code already exists' }), {
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

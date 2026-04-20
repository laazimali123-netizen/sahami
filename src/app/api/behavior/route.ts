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
    return new Response(JSON.stringify({ error: 'No school assigned' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || '';
  const type = searchParams.get('type') || '';
  const category = searchParams.get('category') || '';

  const where: any = { schoolId: session.schoolId };
  if (studentId) where.studentId = studentId;
  if (type) where.type = type;
  if (category) where.category = category;

  const records = await db.behaviorRecord.findMany({
    where,
    include: {
      student: { select: { id: true, studentId: true, firstName: true, lastName: true } },
      recorder: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
  });

  return new Response(JSON.stringify({ records }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  const proCheck = requireProAccess(session);
  if (proCheck) return proCheck;

  if (!session.schoolId) {
    return new Response(JSON.stringify({ error: 'No school assigned' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const { studentId, type, category, description, date } = body;

    if (!studentId || !date) {
      return new Response(JSON.stringify({ error: 'Student and date are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const record = await db.behaviorRecord.create({
      data: {
        studentId,
        type: type || 'POSITIVE',
        category: category || 'OTHER',
        description: description || null,
        date,
        recordedBy: session.userId,
        schoolId: session.schoolId,
      },
      include: {
        student: { select: { firstName: true, lastName: true, studentId: true } },
        recorder: { select: { name: true } },
      },
    });

    return new Response(JSON.stringify({ record }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ error: 'Record ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  await db.behaviorRecord.delete({ where: { id } });
  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

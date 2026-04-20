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
  const classId = searchParams.get('classId') || '';
  const subjectId = searchParams.get('subjectId') || '';
  const status = searchParams.get('status') || '';

  const where: any = { schoolId: session.schoolId };
  if (classId) where.classId = classId;
  if (subjectId) where.subjectId = subjectId;
  if (status) where.status = status;

  const homeworks = await db.homework.findMany({
    where,
    include: {
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  return new Response(JSON.stringify({ homeworks }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
    const { title, description, classId, subjectId, dueDate } = body;

    if (!title || !classId || !subjectId || !dueDate) {
      return new Response(JSON.stringify({ error: 'Title, class, subject, and due date are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const homework = await db.homework.create({
      data: {
        title,
        description: description || null,
        classId,
        subjectId,
        teacherId: session.userId,
        dueDate,
        schoolId: session.schoolId,
      },
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    });

    return new Response(JSON.stringify({ homework }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Homework ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const homework = await db.homework.update({
      where: { id },
      data,
    });

    return new Response(JSON.stringify({ homework }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
    return new Response(JSON.stringify({ error: 'Homework ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  await db.homework.delete({ where: { id } });
  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

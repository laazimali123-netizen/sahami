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

  const where: any = { schoolId: session.schoolId };
  if (classId) where.classId = classId;

  const exams = await db.exam.findMany({
    where,
    include: {
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, name: true } },
    },
    orderBy: { date: 'asc' },
  });

  return new Response(JSON.stringify({ exams }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
    const { title, subjectId, classId, date, startTime, endTime, totalMarks, room } = body;

    if (!title || !subjectId || !classId || !date || !startTime || !endTime) {
      return new Response(JSON.stringify({ error: 'Title, subject, class, date, start time, and end time are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const exam = await db.exam.create({
      data: {
        title,
        subjectId,
        classId,
        teacherId: session.userId,
        date,
        startTime,
        endTime,
        totalMarks: totalMarks ? parseFloat(totalMarks) : 100,
        room: room || null,
        schoolId: session.schoolId,
      },
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    });

    return new Response(JSON.stringify({ exam }), { status: 201, headers: { 'Content-Type': 'application/json' } });
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
      return new Response(JSON.stringify({ error: 'Exam ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const exam = await db.exam.update({
      where: { id },
      data,
    });

    return new Response(JSON.stringify({ exam }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
    return new Response(JSON.stringify({ error: 'Exam ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  await db.exam.delete({ where: { id } });
  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

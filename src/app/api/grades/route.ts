// ═══════════════════════════════════════════════════════════
// SAHAMI - Grades API
// GET    /api/grades - List grades (filter by class, subject, student, term)
// POST   /api/grades - Create new grade entry
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  if (!session.schoolId) {
    return new Response(JSON.stringify({ error: 'No school assigned' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId') || '';
  const subjectId = searchParams.get('subjectId') || '';
  const studentId = searchParams.get('studentId') || '';
  const term = searchParams.get('term') || '';

  const where: any = { class: { schoolId: session.schoolId } };
  if (classId) where.classId = classId;
  if (subjectId) where.subjectId = subjectId;
  if (studentId) where.studentId = studentId;
  if (term) where.term = term;

  const grades = await db.grade.findMany({
    where,
    include: {
      student: { select: { id: true, studentId: true, firstName: true, lastName: true } },
      subject: { select: { name: true, code: true } },
      class: { select: { name: true } },
    },
    orderBy: [{ term: 'asc' }, { date: 'desc' }],
  });

  return new Response(JSON.stringify({ grades }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

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
    const { studentId, subjectId, classId, term, type, title, score, maxScore, comments } = body;

    if (!studentId || !subjectId || !classId || !score) {
      return new Response(JSON.stringify({ error: 'studentId, subjectId, classId, and score are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const grade = await db.grade.create({
      data: {
        studentId,
        subjectId,
        classId,
        teacherId: session.userId,
        term: term || 'Term 1',
        type: type || 'EXAM',
        title: title || 'Assessment',
        score: parseFloat(score),
        maxScore: parseFloat(maxScore) || 100,
        date: new Date().toISOString().split('T')[0],
        comments: comments || null,
      },
      include: {
        student: { select: { firstName: true, lastName: true, studentId: true } },
        subject: { select: { name: true, code: true } },
      },
    });

    return new Response(JSON.stringify({ grade }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Create grade error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

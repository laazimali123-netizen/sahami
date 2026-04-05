// ═══════════════════════════════════════════════════════════
// SAHAMI - Attendance API
// GET    /api/attendance - Get attendance records (filter by class, date)
// POST   /api/attendance - Mark attendance for a class
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
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const studentId = searchParams.get('studentId') || '';

  // AttendanceRecord has no schoolId — filter by classIds belonging to the school
  const classFilter: any = { schoolId: session.schoolId };
  if (classId) classFilter.id = classId;
  const schoolClasses = await db.schoolClass.findMany({
    where: classFilter,
    select: { id: true },
  });
  const schoolClassIds = schoolClasses.map(c => c.id);

  const where: any = { classId: { in: schoolClassIds }, date };
  if (studentId) where.studentId = studentId;

  const records = await db.attendanceRecord.findMany({
    where,
    include: {
      student: { select: { id: true, studentId: true, firstName: true, lastName: true } },
    },
    orderBy: [{ classId: 'asc' }, { studentId: 'asc' }],
  });

  return new Response(JSON.stringify({ records, date }), {
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
    const { classId, date, records } = body; // records: [{ studentId, status, notes? }]

    if (!classId || !date || !records || !Array.isArray(records)) {
      return new Response(JSON.stringify({ error: 'classId, date, and records array are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify the teacher has access to this class
    if (session.role === 'TEACHER') {
      const assignment = await db.classTeacher.findFirst({
        where: { classId, teacherId: session.userId },
      });
      if (!assignment) {
        return new Response(JSON.stringify({ error: 'You are not assigned to this class' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Upsert attendance records
    const results = await Promise.all(
      records.map(async (record: { studentId: string; status: string; notes?: string }) => {
        return db.attendanceRecord.upsert({
          where: {
            studentId_classId_date: {
              studentId: record.studentId,
              classId,
              date,
            },
          },
          update: {
            status: record.status,
            notes: record.notes || null,
            markedBy: session.userId,
          },
          create: {
            studentId: record.studentId,
            classId,
            date,
            status: record.status,
            notes: record.notes || null,
            markedBy: session.userId,
          },
          include: {
            student: { select: { firstName: true, lastName: true, studentId: true } },
          },
        });
      })
    );

    return new Response(JSON.stringify({
      success: true,
      message: `Attendance marked for ${results.length} students`,
      records: results,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Attendance error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

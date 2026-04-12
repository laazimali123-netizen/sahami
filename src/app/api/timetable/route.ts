// ═══════════════════════════════════════════════════════════
// SAHAMI - Timetable API
// GET    /api/timetable - Get timetable slots (filter by class or teacher)
// POST   /api/timetable - Create timetable slot
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
  const teacherId = searchParams.get('teacherId') || session.userId;

  const where: any = { schoolId: session.schoolId };
  if (classId) where.classId = classId;
  if (teacherId && session.role === 'TEACHER') where.teacherId = session.userId;
  else if (teacherId) where.teacherId = teacherId;

  const slots = await db.timetableSlot.findMany({
    where,
    include: {
      subject: { select: { name: true, code: true } },
      teacher: { select: { name: true } },
      class: { select: { name: true, gradeLevel: true, section: true } },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  // Group by day of week
  const grouped = slots.reduce((acc: any, slot) => {
    if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {});

  return new Response(JSON.stringify({ slots, grouped }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  if (!['OWNER', 'MANAGER'].includes(session.role)) {
    return new Response(JSON.stringify({ error: 'Only owners and managers can create timetable slots' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, slots } = body;

    // Support bulk creation
    if (slots && Array.isArray(slots)) {
      const created = await Promise.all(
        slots.map((slot: any) =>
          db.timetableSlot.create({
            data: {
              classId: slot.classId,
              subjectId: slot.subjectId,
              teacherId: slot.teacherId,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              schoolId: session.schoolId!,
            },
          })
        )
      );
      return new Response(JSON.stringify({ slots: created }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Single slot creation
    if (!classId || !subjectId || !teacherId || !dayOfWeek || !startTime || !endTime) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const slot = await db.timetableSlot.create({
      data: {
        classId, subjectId, teacherId, dayOfWeek, startTime, endTime,
        schoolId: session.schoolId!,
      },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
        class: { select: { name: true } },
      },
    });

    return new Response(JSON.stringify({ slot }), {
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

// ═══════════════════════════════════════════════════════════
// SAHAMI - Students API
// GET    /api/students - List all students (with search, filter, pagination)
// POST   /api/students - Create new student
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
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const classId = searchParams.get('classId') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = { schoolId: session.schoolId };
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { studentId: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (status) where.status = status;
  if (classId) {
    where.enrollments = { some: { classId } };
  }

  const [students, total] = await Promise.all([
    db.student.findMany({
      where,
      include: {
        enrollments: {
          include: { class: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.student.count({ where }),
  ]);

  return new Response(JSON.stringify({ students, total, page, limit }), {
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

  // Only managers can create students
  if (session.role !== 'MANAGER') {
    return new Response(JSON.stringify({ error: 'Only managers can create students' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const {
      firstName, lastName, dateOfBirth, gender, address, phone, email,
      guardianName, guardianPhone, guardianRelation, classId,
    } = body;

    if (!firstName || !lastName) {
      return new Response(JSON.stringify({ error: 'First name and last name are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check student limit
    const studentCount = await db.student.count({ where: { schoolId: session.schoolId } });
    const school = await db.school.findUnique({ where: { id: session.schoolId! } });
    if (school && studentCount >= school.maxStudents) {
      return new Response(JSON.stringify({
        error: `Student limit reached (${school.maxStudents}). Upgrade your plan for more capacity.`
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate student ID
    const year = new Date().getFullYear();
    const count = studentCount + 1;
    const studentId = `STU-${year}-${String(count).padStart(4, '0')}`;

    // Create student
    const student = await db.student.create({
      data: {
        studentId,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth || null,
        gender: gender || 'MALE',
        address: address || null,
        phone: phone || null,
        email: email || null,
        guardianName: guardianName || null,
        guardianPhone: guardianPhone || null,
        guardianRelation: guardianRelation || null,
        schoolId: session.schoolId,
        enrollDate: new Date().toISOString().split('T')[0],
        ...(classId ? {
          enrollments: {
            create: { classId },
          },
        } : {}),
      },
      include: {
        enrollments: { include: { class: true } },
      },
    });

    return new Response(JSON.stringify({ student }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Create student error:', error);
    if (error.code === 'P2002') {
      return new Response(JSON.stringify({ error: 'A student with this email already exists' }), {
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

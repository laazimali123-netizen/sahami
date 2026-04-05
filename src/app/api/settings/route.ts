// ═══════════════════════════════════════════════════════════
// SAHAMI - Settings API
// GET    /api/settings - Get school settings
// PUT    /api/settings - Update school settings
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

  const school = await db.school.findUnique({
    where: { id: session.schoolId },
    select: {
      id: true, name: true, nameAr: true, address: true, phone: true,
      email: true, logo: true, plan: true, maxStudents: true,
      maxTeachers: true, academicYear: true, isActive: true, createdAt: true,
    },
  });

  // Get subscription info
  const studentCount = await db.student.count({ where: { schoolId: session.schoolId, status: 'ACTIVE' } });
  const teacherCount = await db.user.count({ where: { schoolId: session.schoolId, role: 'TEACHER', isActive: true } });

  return new Response(JSON.stringify({
    school,
    usage: {
      students: studentCount,
      teachers: teacherCount,
      studentLimit: school?.maxStudents || 100,
      teacherLimit: school?.maxTeachers || 20,
      studentUsage: Math.round((studentCount / (school?.maxStudents || 100)) * 100),
      teacherUsage: Math.round((teacherCount / (school?.maxTeachers || 20)) * 100),
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  if (session.role !== 'MANAGER') {
    return new Response(JSON.stringify({ error: 'Only managers can update settings' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { name, nameAr, address, phone, email, academicYear, plan } = body;

    const school = await db.school.update({
      where: { id: session.schoolId },
      data: {
        ...(name && { name }),
        ...(nameAr !== undefined && { nameAr }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(academicYear && { academicYear }),
        ...(plan && { plan, maxStudents: plan === 'PRO' ? 500 : 100, maxTeachers: plan === 'PRO' ? 50 : 20 }),
      },
    });

    return new Response(JSON.stringify({ school }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

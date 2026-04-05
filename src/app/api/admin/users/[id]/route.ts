// ═══════════════════════════════════════════════════════════
// SAHAMI - Admin: User Detail API
// PUT    /api/admin/users/[id] - Update user
// DELETE /api/admin/users/[id] - Deactivate user
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, hashPassword } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;

  if (auth.session.role !== 'SUPER_ADMIN') {
    return new Response(JSON.stringify({ error: 'Super admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, email, phone, role, isActive, password, schoolId } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (schoolId !== undefined) updateData.schoolId = schoolId;
    if (password && password.length >= 6) {
      updateData.password = await hashPassword(password);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      include: {
        school: { select: { id: true, name: true, plan: true } },
        _count: { select: { classAssignments: true, grades: true, attendanceMarks: true } },
      },
    });

    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;

  if (auth.session.role !== 'SUPER_ADMIN') {
    return new Response(JSON.stringify({ error: 'Super admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = await params;

  // Don't allow deleting yourself
  if (id === auth.session.userId) {
    return new Response(JSON.stringify({ error: 'Cannot deactivate your own account' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.user.update({
    where: { id },
    data: { isActive: false },
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

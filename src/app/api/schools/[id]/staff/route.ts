// ═══════════════════════════════════════════════════════════
// SAHAMI - Staff Management: Create Staff Account
// POST /api/schools/[id]/staff
// Only OWNER and MANAGER can create staff accounts
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, hashPassword } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticateRequest(request);
    if ('error' in auth) return auth.error;

    const { session } = auth;
    const { id: schoolId } = await params;

    // Only OWNER or MANAGER can create staff
    if (!['OWNER', 'MANAGER'].includes(session.role)) {
      return new Response(JSON.stringify({
        error: 'Only school owners and managers can create staff accounts.',
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify the school belongs to the user's session
    if (session.schoolId !== schoolId) {
      return new Response(JSON.stringify({
        error: 'You can only manage staff for your own school.',
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    // Validate required fields
    if (!name?.trim()) {
      return new Response(JSON.stringify({ error: 'Staff name is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!email?.trim() || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email address is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!password || password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate role
    const validRoles = ['TEACHER', 'MANAGER', 'FINANCE'];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return new Response(JSON.stringify({
        error: `This email (${email}) is already registered on the platform.`,
        field: 'email',
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create the staff account
    const hashedPassword = await hashPassword(password);
    const user = await db.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name.trim(),
        role,
        schoolId,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      message: `Staff account created: ${user.name} (${user.role})`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Create staff error:', error);

    if (error.code === 'P2002') {
      return new Response(JSON.stringify({
        error: 'This email is already taken. Please use a different email address.',
        field: 'email',
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Internal server error. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ═══════════════════════════════════════════════════════════
// GET /api/schools/[id]/staff
// List all staff members for a school (OWNER/MANAGER only)
// ═══════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticateRequest(request);
    if ('error' in auth) return auth.error;

    const { session } = auth;
    const { id: schoolId } = await params;

    // Only OWNER or MANAGER can view staff list
    if (!['OWNER', 'MANAGER'].includes(session.role)) {
      return new Response(JSON.stringify({
        error: 'Only school owners and managers can view staff.',
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify the school belongs to the user
    if (session.schoolId !== schoolId) {
      return new Response(JSON.stringify({
        error: 'You can only view staff for your own school.',
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const staff = await db.user.findMany({
      where: {
        schoolId,
        role: { in: ['OWNER', 'MANAGER', 'TEACHER', 'FINANCE'] },
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            classAssignments: true,
            grades: true,
            attendanceMarks: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return new Response(JSON.stringify({ staff }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Get staff error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ═══════════════════════════════════════════════════════════
// PATCH /api/schools/[id]/staff
// Toggle staff active/inactive status
// ═══════════════════════════════════════════════════════════

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticateRequest(request);
    if ('error' in auth) return auth.error;

    const { session } = auth;
    const { id: schoolId } = await params;

    if (!['OWNER', 'MANAGER'].includes(session.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (session.schoolId !== schoolId) {
      return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { userId, isActive } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Don't allow deactivating yourself
    if (userId === session.userId) {
      return new Response(JSON.stringify({
        error: 'You cannot deactivate your own account.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await db.user.findFirst({
      where: { id: userId, schoolId },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { isActive: typeof isActive === 'boolean' ? isActive : !user.isActive },
      select: { id: true, name: true, isActive: true },
    });

    return new Response(JSON.stringify({
      success: true,
      message: `${updated.name} has been ${updated.isActive ? 'activated' : 'deactivated'}.`,
      user: updated,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Toggle staff error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

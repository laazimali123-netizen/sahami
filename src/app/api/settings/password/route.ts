import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// PUT /api/settings/password — change user password
export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session, user } = auth;

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return new Response(JSON.stringify({ error: 'Current and new password are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'New password must be at least 6 characters' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Import dynamically to avoid issues
    const { verifyPassword, hashPassword } = await import('@/lib/auth');

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user!.password);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Current password is incorrect' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Update password
    const hashed = await hashPassword(newPassword);
    await db.user.update({
      where: { id: session.userId },
      data: { password: hashed },
    });

    return new Response(JSON.stringify({ success: true, message: 'Password changed successfully' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

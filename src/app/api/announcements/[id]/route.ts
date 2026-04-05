// ═══════════════════════════════════════════════════════════
// SAHAMI - Announcement Detail API
// DELETE /api/announcements/[id] - Delete announcement (manager only)
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;
  const { id } = await params;

  if (session.role !== 'MANAGER') {
    return new Response(JSON.stringify({ error: 'Only managers can delete announcements' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.announcement.delete({
    where: { id, schoolId: session.schoolId },
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

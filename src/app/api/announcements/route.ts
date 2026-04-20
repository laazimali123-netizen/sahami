// ═══════════════════════════════════════════════════════════
// SAHAMI - Announcements API
// GET    /api/announcements - List announcements
// POST   /api/announcements - Create announcement
// ═══════════════════════════════════════════════════════════

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
    return new Response(JSON.stringify({ error: 'No school assigned' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const announcements = await db.announcement.findMany({
    where: { schoolId: session.schoolId },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  });

  return new Response(JSON.stringify({ announcements }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  const proCheck = requireProAccess(session);
  if (proCheck) return proCheck;

  try {
    const body = await request.json();
    const { title, content, priority } = body;

    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const announcement = await db.announcement.create({
      data: {
        title,
        content,
        priority: priority || 'NORMAL',
        schoolId: session.schoolId!,
        authorId: session.userId,
      },
    });

    return new Response(JSON.stringify({ announcement }), {
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

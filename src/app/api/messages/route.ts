// ═══════════════════════════════════════════════════════════
// SAHAMI - Messages API (PRO TIER ONLY)
// GET    /api/messages - List messages (sent/received)
// POST   /api/messages - Send a message
// PUT    /api/messages - Mark messages as read
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

/** Check if user has PRO or active 30-day trial */
function canAccessPro(session: any): boolean {
  if (session.schoolPlan === 'PRO') return true;
  if (session.role === 'FINANCE') return true;
  if (session.trialStart) {
    const diffDays = (Date.now() - new Date(session.trialStart).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= 30) return true;
  }
  return false;
}

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

  if (!canAccessPro(session)) {
    return new Response(JSON.stringify({ error: 'Messaging requires PRO plan. Upgrade to unlock this feature.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get('folder') || 'inbox'; // inbox | sent

  const where: any = {};
  if (folder === 'inbox') {
    where.receiverId = session.userId;
  } else {
    where.senderId = session.userId;
  }

  const messages = await db.message.findMany({
    where,
    include: {
      sender: { select: { id: true, name: true, avatar: true, role: true } },
      receiver: { select: { id: true, name: true, avatar: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await db.message.count({
    where: { receiverId: session.userId, isRead: false },
  });

  return new Response(JSON.stringify({ messages, unreadCount }), {
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

  if (!canAccessPro(session)) {
    return new Response(JSON.stringify({ error: 'Messaging requires PRO plan. Upgrade to unlock this feature.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { receiverId, subject, content } = body;

    if (!receiverId || !subject || !content) {
      return new Response(JSON.stringify({ error: 'receiverId, subject, and content are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify receiver is in the same school
    const receiver = await db.user.findFirst({
      where: { id: receiverId, schoolId: session.schoolId },
    });

    if (!receiver) {
      return new Response(JSON.stringify({ error: 'Recipient not found in your school' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const message = await db.message.create({
      data: {
        senderId: session.userId,
        receiverId,
        subject,
        content,
      },
      include: {
        sender: { select: { name: true, avatar: true } },
        receiver: { select: { name: true, avatar: true } },
      },
    });

    return new Response(JSON.stringify({ message }), {
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

// Mark message as read
export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  try {
    const body = await request.json();
    const { messageIds } = body;

    if (messageIds && Array.isArray(messageIds)) {
      await db.message.updateMany({
        where: { id: { in: messageIds }, receiverId: session.userId },
        data: { isRead: true },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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

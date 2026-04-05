import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  if (!session.userId) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');

  const notifications = await db.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const unreadCount = await db.notification.count({
    where: { userId: session.userId, isRead: false },
  });

  return new Response(JSON.stringify({ notifications, unreadCount }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  try {
    const body = await request.json();

    if (body.markAllRead && session.userId) {
      await db.notification.updateMany({
        where: { userId: session.userId, isRead: false },
        data: { isRead: true },
      });
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (body.markRead && body.notificationId) {
      await db.notification.update({
        where: { id: body.notificationId },
        data: { isRead: true },
      });
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Create notification (internal use)
    if (body.userId && body.title && body.message) {
      const notification = await db.notification.create({
        data: {
          userId: body.userId,
          title: body.title,
          message: body.message,
          type: body.type || 'INFO',
        },
      });
      return new Response(JSON.stringify({ notification }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

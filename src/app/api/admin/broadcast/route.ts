// ═══════════════════════════════════════════════════════════
// SAHAMI - Admin Broadcast API (SUPER_ADMIN only)
// POST   /api/admin/broadcast - Send broadcast message (max 3/week)
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

/** Get the start of the current calendar week (Monday) */
function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  if (session.role !== 'SUPER_ADMIN') {
    return new Response(JSON.stringify({ error: 'Only super admins can send broadcasts' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { title, content, type } = body;

    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validTypes = ['EMAIL', 'SMS'];
    const broadcastType = type || 'EMAIL';
    if (!validTypes.includes(broadcastType)) {
      return new Response(JSON.stringify({ error: 'Type must be EMAIL or SMS' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check weekly limit (max 3 per calendar week, Mon-Sun)
    const weekStart = getWeekStart();
    const weeklyCount = await db.broadcast.count({
      where: {
        senderId: session.userId,
        createdAt: { gte: weekStart },
      },
    });

    if (weeklyCount >= 3) {
      return new Response(JSON.stringify({
        error: 'Weekly broadcast limit reached (3 per week). Please try again next week.',
        weeklyCount,
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create broadcast
    const broadcast = await db.broadcast.create({
      data: {
        senderId: session.userId,
        title,
        content,
        type: broadcastType,
      },
    });

    // In a real app, we would send emails/SMS here to all schools
    // For now, just store the broadcast record

    return new Response(JSON.stringify({
      broadcast,
      remainingThisWeek: 3 - weeklyCount - 1,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Broadcast error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  if (session.role !== 'SUPER_ADMIN') {
    return new Response(JSON.stringify({ error: 'Only super admins can view broadcasts' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get broadcasts with weekly count
  const weekStart = getWeekStart();
  const [broadcasts, weeklyCount] = await Promise.all([
    db.broadcast.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sender: { select: { name: true, email: true } },
      },
    }),
    db.broadcast.count({
      where: {
        senderId: session.userId,
        createdAt: { gte: weekStart },
      },
    }),
  ]);

  return new Response(JSON.stringify({
    broadcasts,
    weeklyCount,
    remainingThisWeek: 3 - weeklyCount,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

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
    return new Response(JSON.stringify({ error: 'No school assigned' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || '';
  const month = searchParams.get('month') || '';

  const where: any = { schoolId: session.schoolId };
  if (type) where.type = type;
  if (month) {
    where.startDate = { startsWith: month };
  }

  const events = await db.event.findMany({
    where,
    orderBy: { startDate: 'asc' },
  });

  return new Response(JSON.stringify({ events }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  const proCheck = requireProAccess(session);
  if (proCheck) return proCheck;

  if (!session.schoolId) {
    return new Response(JSON.stringify({ error: 'No school assigned' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const { title, description, startDate, endDate, type } = body;

    if (!title || !startDate) {
      return new Response(JSON.stringify({ error: 'Title and start date are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const event = await db.event.create({
      data: {
        title,
        description: description || null,
        startDate,
        endDate: endDate || null,
        type: type || 'OTHER',
        schoolId: session.schoolId,
      },
    });

    return new Response(JSON.stringify({ event }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Event ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const event = await db.event.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.type && { type: data.type }),
      },
    });

    return new Response(JSON.stringify({ event }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ error: 'Event ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  await db.event.delete({ where: { id } });
  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

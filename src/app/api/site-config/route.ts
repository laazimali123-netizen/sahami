import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// GET /api/site-config — public, returns all site config as key-value object
export async function GET() {
  try {
    const configs = await db.siteConfig.findMany();
    const configObj: Record<string, string> = {};
    configs.forEach((c) => { configObj[c.key] = c.value; });
    return new Response(JSON.stringify({ config: configObj }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ config: {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// PUT /api/site-config — SUPER_ADMIN only, upsert key-value pairs
export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  if (session.role !== 'SUPER_ADMIN') {
    return new Response(JSON.stringify({ error: 'Only super admins can update site config' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { configs } = body; // { key: value, ... }

    if (!configs || typeof configs !== 'object') {
      return new Response(JSON.stringify({ error: 'configs object is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = await Promise.all(
      Object.entries(configs).map(([key, value]) =>
        db.siteConfig.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    return new Response(JSON.stringify({ success: true, updated: results.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Site config error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

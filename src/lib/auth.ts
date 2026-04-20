// ═══════════════════════════════════════════════════════════
// SAHAMI - Authentication & Authorization Utilities
// JWT-free session management using secure tokens
// ═══════════════════════════════════════════════════════════

import bcrypt from 'bcryptjs';
import { db } from './db';

const SESSION_COOKIE_NAME = 'sahami_session';

/** Hash a plaintext password using bcrypt (10 salt rounds) */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** Verify a plaintext password against a stored hash */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Generate a cryptographically random session token */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Session data shape stored in cookie */
export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'TEACHER' | 'FINANCE';
  schoolId: string | null;
  schoolName: string | null;
  schoolPlan: string | null;
  trialStart: string | null;
}

/** Role hierarchy for permission checks */
const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  OWNER: 80,
  MANAGER: 50,
  FINANCE: 40,
  TEACHER: 10,
};

/** Check if a user has at least the required role level */
export function hasPermission(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

/** Check if a school's trial period is still active (within 30 days) */
export function isTrialActive(school: { trialStart: Date | string | null } | null): boolean {
  if (!school || !school.trialStart) return false;
  const trialStart = new Date(school.trialStart);
  const now = new Date();
  const diffMs = now.getTime() - trialStart.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 30;
}

/** Check if user can access a feature based on subscription plan */
export function hasFeature(plan: string | null, feature: string, trialActive?: boolean): boolean {
  // FREE (BASIC) always works: only dashboard, students, teachers, settings
  const BASIC_FEATURES = ['dashboard', 'students', 'teachers', 'settings'];
  // Everything else requires PRO or active trial
  const PRO_ONLY_FEATURES = [
    'classes', 'subjects', 'attendance', 'grades', 'timetable',
    'announcements', 'events', 'exams', 'homework', 'behavior',
    'messages', 'fees', 'payments', 'reports', 'staff',
  ];

  if (PRO_ONLY_FEATURES.includes(feature)) {
    return plan === 'PRO' || !!trialActive;
  }
  return BASIC_FEATURES.includes(feature);
}

/** Check if a session has PRO access (either paid or active 30-day trial) */
export function isProOrTrial(session: { schoolPlan: string | null; trialStart: string | null; role: string }): boolean {
  if (session.schoolPlan === 'PRO') return true;
  if (session.role === 'SUPER_ADMIN') return true;
  if (session.role === 'FINANCE') return true;
  if (session.trialStart) {
    const diffDays = (Date.now() - new Date(session.trialStart).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= 30) return true;
  }
  return false;
}

/** Middleware: return 403 if user doesn't have PRO access */
export function requireProAccess(session: { schoolPlan: string | null; trialStart: string | null; role: string }): Response | null {
  if (isProOrTrial(session)) return null;
  return new Response(JSON.stringify({ error: 'This feature requires a PRO plan. Upgrade to unlock it.' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Parse session from cookie header */
export function parseSession(cookieHeader: string | null): SessionData | null {
  if (!cookieHeader) return null;

  try {
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach((cookie) => {
      const [key, ...rest] = cookie.trim().split('=');
      if (key && rest.length > 0) {
        cookies[key.trim()] = decodeURIComponent(rest.join('='));
      }
    });

    const sessionStr = cookies[SESSION_COOKIE_NAME];
    if (!sessionStr) return null;

    // Session is base64 encoded JSON
    const jsonStr = Buffer.from(sessionStr, 'base64').toString('utf-8');
    return JSON.parse(jsonStr) as SessionData;
  } catch {
    return null;
  }
}

/** Serialize session data to cookie value */
export function serializeSession(session: SessionData): string {
  const jsonStr = JSON.stringify(session);
  return Buffer.from(jsonStr).toString('base64');
}

/** Get session cookie header for response */
export function getSessionCookie(session: SessionData): string {
  const value = serializeSession(session);
  const isSecure = process.env.NODE_ENV === 'production';
  return `${SESSION_COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${isSecure ? '; Secure' : ''}`;
}

/** Get cookie header to clear session */
export function getClearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/** Safely decode a base64 string to UTF-8, handling unicode characters */
function safeBase64Decode(str: string): string {
  try {
    const decoded = Buffer.from(str, 'base64').toString('utf-8');
    JSON.parse(decoded); // validate it's valid JSON
    return decoded;
  } catch {
    try {
      return decodeURIComponent(escape(Buffer.from(str, 'base64').toString('binary')));
    } catch {
      return '';
    }
  }
}

/** Authenticate request and return session + user */
export async function authenticateRequest(request: Request): Promise<{
  session: SessionData;
  user: Awaited<ReturnType<typeof db.user.findUnique>>;
} | { error: Response }> {
  // Try cookie first
  let session = parseSession(request.headers.get('cookie'));

  // Fallback: check Authorization header (base64 encoded JSON)
  if (!session) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const jsonStr = safeBase64Decode(token);
        if (jsonStr) {
          session = JSON.parse(jsonStr) as SessionData;
        }
      } catch {
        // invalid token
      }
    }
  }

  if (!session) {
    return {
      error: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { school: true },
  });

  if (!user || !user.isActive) {
    return {
      error: new Response(JSON.stringify({ error: 'Account deactivated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Set-Cookie': getClearSessionCookie() },
      }),
    };
  }

  // Update session with latest school plan and trial info
  if (user.school) {
    if (session.schoolPlan !== user.school.plan) {
      session.schoolPlan = user.school.plan;
    }
    // Always update trialStart from database
    if (user.school.trialStart) {
      session.trialStart = user.school.trialStart instanceof Date
        ? user.school.trialStart.toISOString()
        : String(user.school.trialStart);
    }
  }

  return { session, user };
}

/** Middleware: Require specific role for an endpoint */
export function requireRole(session: SessionData, roles: string[]): boolean {
  return roles.includes(session.role);
}

import { cookies } from 'next/headers';
import { db } from './db';
import { randomBytes, createHash } from 'crypto';

const SESSION_COOKIE_NAME = 'neon_erp_session';
const SESSION_EXPIRY_DAYS = 7;

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    console.log('getSession - token found:', !!token);

    if (!token) return null;

    // @ts-ignore
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true },
    });
    console.log('getSession - session found:', !!session);

    if (!session) return null;

    if (new Date() > session.expiresAt) {
      console.log('getSession - session expired');
      try {
        await db.session.delete({ where: { token } });
      } catch (e) {
        // Ignore if delete fails
      }
      return null;
    }

    return session;
  } catch (error) {
    console.error('getSession error:', error);
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: false, // Set to false for development
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function logout() {
  const session = await getSession();
  if (session) {
    try {
      // @ts-ignore
      await db.session.delete({ where: { token: session.token } });
    } catch (e) {
      // Ignore if delete fails
    }
  }
  await clearSessionCookie();
}

export async function getCurrentUser() {
  try {
    const session = await getSession();
    console.log('getCurrentUser - session found:', !!session);
    console.log('getCurrentUser - user found:', !!session?.user);
    // @ts-ignore
    return session?.user || null;
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
}

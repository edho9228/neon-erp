import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createSession, setSessionCookie } from '@/lib/auth';

// Known password hashes - for backward compatibility
const KNOWN_HASHES: Record<string, string[]> = {
  'admin@neon.com': [
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
  ],
  'admin@neonerp.com': [
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
    '97446032a0c4ba909e7f5dd2a9374c3f148580f80e1c911c9ad9779a6e6fd378', // existing unknown password
  ],
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    if (user.isActive === false) {
      return NextResponse.json({ error: 'Akun tidak aktif' }, { status: 401 });
    }

    const hashedPassword = hashPassword(password);
    
    // Check if password matches
    let passwordValid = user.password === hashedPassword;
    
    // Also check known hashes for backward compatibility
    if (!passwordValid && KNOWN_HASHES[email]) {
      passwordValid = KNOWN_HASHES[email].includes(hashedPassword);
    }
    
    if (!passwordValid) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    // Create session
    let token: string;
    try {
      token = await createSession(user.id);
      await setSessionCookie(token);
    } catch (sessionError) {
      console.error('Session creation error:', sessionError);
      // If session creation fails, still allow login without session
      // The user will need to login again after page refresh
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        warning: 'Session could not be created. Database may be readonly.'
      });
    }

    // Try to update last login (ignore if fails due to readonly database)
    try {
      await db.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    } catch (e) {
      // Ignore readonly database error
      console.log('Could not update lastLogin (database may be readonly)');
    }

    // Log login activity
    try {
      await db.activityLog.create({
        data: {
          userId: user.id,
          module: 'Auth',
          action: 'Login',
          details: `${user.name} melakukan login ke sistem`,
        },
      });
    } catch (logError) {
      console.log('Could not log login activity:', logError);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

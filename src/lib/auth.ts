import bcrypt from 'bcryptjs';
import { getSettings } from './db';
import db from './db';

export async function checkPassword(password: string): Promise<boolean> {
  const stored = getSettings().admin_password ?? '';

  if (stored.startsWith('$2')) {
    // Proper bcrypt hash
    return bcrypt.compare(password, stored);
  }

  // Plain-text (legacy) — compare and auto-upgrade to bcrypt
  if (password === stored) {
    const hash = await bcrypt.hash(password, 12);
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('admin_password', hash);
    return true;
  }
  return false;
}

export function setSession(cookies: any) {
  cookies.set('admin_session', 'authenticated', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSession(cookies: any) {
  cookies.delete('admin_session', { path: '/' });
}

export function isAuthenticated(cookies: any) {
  return cookies.get('admin_session')?.value === 'authenticated';
}

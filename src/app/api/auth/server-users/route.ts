import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { UserAccount } from '@/types/auth';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'kasra_server_users.json');

async function readServerUsers(): Promise<UserAccount[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const content = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(content) as UserAccount[];
  } catch {
    return [];
  }
}

async function writeServerUsers(users: UserAccount[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.trim().toLowerCase();

  const users = await readServerUsers();
  if (email) {
    const user = users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      return NextResponse.json({ exists: false });
    }
    const { passwordHash, passwordSalt, ...safeUser } = user;
    return NextResponse.json({ exists: true, user: safeUser });
  }

  const safeUsers = users.map(({ passwordHash, passwordSalt, ...safe }) => safe);
  return NextResponse.json({ users: safeUsers, total: users.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'register';

    if (action === 'reset_all_accounts') {
      await writeServerUsers([]);
      return NextResponse.json({ success: true, message: 'Semua akun server telah dibersihkan.' });
    }

    if (action === 'register') {
      const user = body.user as UserAccount;
      if (!user || !user.email) {
        return NextResponse.json({ success: false, error: 'Data akun tidak lengkap.' }, { status: 400 });
      }

      const users = await readServerUsers();
      const existingIdx = users.findIndex(
        (u) => u.email.toLowerCase() === user.email.toLowerCase()
      );

      if (existingIdx >= 0) {
        // Update existing user credentials/profile
        users[existingIdx] = {
          ...users[existingIdx],
          ...user,
          lastLoginAt: new Date().toISOString(),
        };
      } else {
        users.push({
          ...user,
          createdAt: user.createdAt || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        });
      }

      await writeServerUsers(users);
      return NextResponse.json({ success: true });
    }

    if (action === 'get_credentials') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!email) {
        return NextResponse.json({ success: false, error: 'Email wajib diisi.' }, { status: 400 });
      }

      const users = await readServerUsers();
      const matched = users.find((u) => u.email.toLowerCase() === email);
      if (!matched) {
        return NextResponse.json({ success: false, error: 'Akun tidak ditemukan di server.' });
      }

      return NextResponse.json({
        success: true,
        user: matched,
      });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak dikenal.' }, { status: 400 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

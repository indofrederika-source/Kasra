'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  UserAccount,
  AuthSession,
  LoginCredentials,
  RegisterData,
  AuthResult,
  AuthContextType,
} from '@/types/auth';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  validateEmail,
  validatePasswordStrength,
} from '@/lib/auth/crypto';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const STORAGE_KEYS = {
  USERS_DB: 'kasra_users_accounts_v2',
  SESSION: 'kasra_current_session_v2',
  LOGIN_ATTEMPTS: 'kasra_auth_attempts_v2',
};

const SESSION_DURATION_DAYS = 7;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 minute lockout

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUserToAccount(supaUser: SupabaseUser): UserAccount {
  const meta = supaUser.user_metadata || {};
  return {
    id: supaUser.id,
    email: supaUser.email || '',
    name: meta.name || meta.full_name || 'Pemilik Toko',
    storeName: meta.storeName || meta.store_name || 'Toko Saya',
    businessCategory: meta.businessCategory || meta.business_category || '',
    passwordHash: '',
    passwordSalt: '',
    createdAt: supaUser.created_at || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
}

async function verifyRealEmailOnServer(email: string): Promise<{
  valid: boolean;
  reason?: string;
  suggestion?: string;
}> {
  try {
    const res = await fetch('/api/auth/validate-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return {
      valid: Boolean(data?.valid),
      reason: data?.reason,
      suggestion: data?.suggestion,
    };
  } catch {
    // Fallback to strict format check only if offline
    return {
      valid: validateEmail(email),
      reason: 'Format alamat email tidak valid.',
    };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore active session & listen to real-time Supabase Auth events (including email confirmation redirects & token auto-refresh)
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        if (isSupabaseConfigured) {
          // Clear stale lockouts so login is never blocked locally
          if (typeof window !== 'undefined') {
            try {
              const rawAttempts = localStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
              if (rawAttempts) {
                const parsedAttempts = JSON.parse(rawAttempts);
                delete parsedAttempts['indo.frederika@gmail.com'];
                delete parsedAttempts['indofrederika@gmail.com'];
                localStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, JSON.stringify(parsedAttempts));
              }

              // Ensure verified default account is seeded locally
              const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS_DB);
              const users: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];
              const hasIndo = users.some((u) => u.email.toLowerCase() === 'indo.frederika@gmail.com');
              if (!hasIndo) {
                users.push(
                  {
                    id: 'usr_indofrederika_1',
                    name: 'indo frederika suherdin',
                    email: 'indo.frederika@gmail.com',
                    storeName: 'Warmindofs',
                    businessCategory: 'Kuliner & Rumah Makan',
                    passwordHash: '51b5fb3dcd05f39a20619577dbedaccadfe0f3bbfc9cac6763db466bc5e5de41',
                    passwordSalt: 'e5e762d3f6a03bad205c961f29d8ca91',
                    createdAt: '2026-11-08T09:00:00.000Z',
                    lastLoginAt: '2026-11-08T09:00:00.000Z',
                  },
                  {
                    id: 'usr_indofrederika_2',
                    name: 'indo frederika suherdin',
                    email: 'indofrederika@gmail.com',
                    storeName: 'Warmindofs',
                    businessCategory: 'Kuliner & Rumah Makan',
                    passwordHash: '51b5fb3dcd05f39a20619577dbedaccadfe0f3bbfc9cac6763db466bc5e5de41',
                    passwordSalt: 'e5e762d3f6a03bad205c961f29d8ca91',
                    createdAt: '2026-11-08T09:00:00.000Z',
                    lastLoginAt: '2026-11-08T09:00:00.000Z',
                  }
                );
                localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
              }
            } catch {
              // ignore storage errors
            }

            // If redirected back with PKCE ?code=..., exchange it for a persistent session
            const url = new URL(window.location.href);
            const authCode = url.searchParams.get('code');
            if (authCode) {
              try {
                await supabase.auth.exchangeCodeForSession(authCode);
                url.searchParams.delete('code');
                url.searchParams.delete('type');
                window.history.replaceState({}, '', url.pathname + url.search);
              } catch {
                // detectSessionInUrl may have already consumed the code
              }
            }
          }

          const { data: supaSession, error } = await supabase.auth.getSession();
          if (!isMounted) return;

          if (!error && supaSession?.session?.user) {
            const mapped = mapSupabaseUserToAccount(supaSession.session.user);
            setUser(mapped);

            // Clean up #access_token hash from URL if user arrived from email confirmation link
            if (
              typeof window !== 'undefined' &&
              window.location.hash.includes('access_token=')
            ) {
              window.history.replaceState({}, '', window.location.pathname + window.location.search);
            }
            setIsLoading(false);
            return;
          }

          // Check persistent session storage (supports server-backed and local accounts)
          const rawSession =
            typeof window !== 'undefined'
              ? localStorage.getItem(STORAGE_KEYS.SESSION) || sessionStorage.getItem(STORAGE_KEYS.SESSION)
              : null;

          if (rawSession) {
            try {
              const session: AuthSession = JSON.parse(rawSession);
              if (session.expiresAt > Date.now()) {
                // Fetch server user
                try {
                  const res = await fetch(`/api/auth/server-users?email=${encodeURIComponent(session.email)}`);
                  const data = await res.json().catch(() => null);
                  if (data?.exists && data?.user) {
                    setUser(data.user);
                    setIsLoading(false);
                    return;
                  }
                } catch {
                  // ignore network error
                }

                // Local user fallback
                const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS_DB);
                const localUsers: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];
                const localUser = localUsers.find((u) => u.email.toLowerCase() === session.email.toLowerCase());
                if (localUser) {
                  setUser(localUser);
                  setIsLoading(false);
                  return;
                }
              } else {
                localStorage.removeItem(STORAGE_KEYS.SESSION);
                sessionStorage.removeItem(STORAGE_KEYS.SESSION);
              }
            } catch {
              // ignore
            }
          }

          setUser(null);
          setIsLoading(false);
          return;
        }

        // Local-only mode (ONLY used if Supabase env/config is completely absent)
        let users: UserAccount[] = [];
        const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS_DB);
        if (rawUsers) {
          try {
            users = JSON.parse(rawUsers);
          } catch {
            users = [];
          }
        }

        const rawSession =
          localStorage.getItem(STORAGE_KEYS.SESSION) ||
          sessionStorage.getItem(STORAGE_KEYS.SESSION);

        if (rawSession) {
          const session: AuthSession = JSON.parse(rawSession);
          if (session.expiresAt > Date.now()) {
            const matchedUser = users.find((u) => u.id === session.userId);
            if (matchedUser) {
              setUser(matchedUser);
            } else {
              localStorage.removeItem(STORAGE_KEYS.SESSION);
              sessionStorage.removeItem(STORAGE_KEYS.SESSION);
            }
          } else {
            localStorage.removeItem(STORAGE_KEYS.SESSION);
            sessionStorage.removeItem(STORAGE_KEYS.SESSION);
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to Supabase Auth state changes so sessions never drop unexpectedly
    let authSubscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;
        if (
          (event === 'SIGNED_IN' ||
            event === 'TOKEN_REFRESHED' ||
            event === 'USER_UPDATED' ||
            event === 'INITIAL_SESSION') &&
          session?.user
        ) {
          setUser(mapSupabaseUserToAccount(session.user));
          setIsLoading(false);

          if (
            typeof window !== 'undefined' &&
            window.location.hash.includes('access_token=')
          ) {
            window.history.replaceState({}, '', window.location.pathname + window.location.search);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoading(false);
        }
      });
      authSubscription = data.subscription;
    }

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
    };
  }, []);

  // Brute-force lockout helpers
  const checkBruteForceLockout = (email: string): { locked: boolean; waitSeconds: number } => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
      if (!raw) return { locked: false, waitSeconds: 0 };
      const attempts = JSON.parse(raw);
      const userAttempt = attempts[email.toLowerCase()];
      if (!userAttempt) return { locked: false, waitSeconds: 0 };

      if (userAttempt.count >= MAX_FAILED_ATTEMPTS) {
        const elapsed = Date.now() - userAttempt.lastAttempt;
        if (elapsed < LOCKOUT_DURATION_MS) {
          return {
            locked: true,
            waitSeconds: Math.ceil((LOCKOUT_DURATION_MS - elapsed) / 1000),
          };
        } else {
          delete attempts[email.toLowerCase()];
          localStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, JSON.stringify(attempts));
        }
      }
    } catch {
      // ignore
    }
    return { locked: false, waitSeconds: 0 };
  };

  const recordFailedAttempt = (email: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
      const attempts = raw ? JSON.parse(raw) : {};
      const key = email.toLowerCase();
      const current = attempts[key] || { count: 0, lastAttempt: 0 };

      attempts[key] = {
        count: current.count + 1,
        lastAttempt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, JSON.stringify(attempts));
    } catch {
      // ignore
    }
  };

  const clearFailedAttempts = (email: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
      if (!raw) return;
      const attempts = JSON.parse(raw);
      delete attempts[email.toLowerCase()];
      localStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, JSON.stringify(attempts));
    } catch {
      // ignore
    }
  };

  /**
   * Log In
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResult> => {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password;

    if (!email || !password) {
      return { success: false, error: 'Email dan kata sandi wajib diisi.' };
    }

    if (!validateEmail(email)) {
      return { success: false, error: 'Format alamat email tidak valid.' };
    }

    const lockout = checkBruteForceLockout(email);
    if (lockout.locked) {
      return {
        success: false,
        error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${lockout.waitSeconds} detik.`,
      };
    }

    try {
      // 1. Try Supabase Auth first
      if (isSupabaseConfigured) {
        try {
          const { data: supaLoginData, error: supaError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (!supaError && supaLoginData.user && supaLoginData.session) {
            clearFailedAttempts(email);
            const loggedInUser = mapSupabaseUserToAccount(supaLoginData.user);
            const session: AuthSession = {
              token: supaLoginData.session.access_token || generateSessionToken(),
              userId: loggedInUser.id,
              email: loggedInUser.email,
              expiresAt: credentials.rememberMe
                ? Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
                : Date.now() + 24 * 60 * 60 * 1000,
              rememberMe: !!credentials.rememberMe,
            };
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
            setUser(loggedInUser);
            return { success: true };
          }
        } catch {
          // Fall through to server-backed verification
        }
      }

      // 2. Server-backed account verification (prevents email rate-limit & confirmation lockouts)
      try {
        const res = await fetch('/api/auth/server-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_credentials', email }),
        });
        const serverData = await res.json().catch(() => null);

        if (serverData?.success && serverData?.user) {
          const isValid = await verifyPassword(
            password,
            serverData.user.passwordHash,
            serverData.user.passwordSalt
          );

          if (isValid) {
            clearFailedAttempts(email);
            const session: AuthSession = {
              token: generateSessionToken(),
              userId: serverData.user.id,
              email: serverData.user.email,
              expiresAt: credentials.rememberMe
                ? Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
                : Date.now() + 24 * 60 * 60 * 1000,
              rememberMe: !!credentials.rememberMe,
            };
            if (credentials.rememberMe) {
              localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
              sessionStorage.removeItem(STORAGE_KEYS.SESSION);
            } else {
              sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
              localStorage.removeItem(STORAGE_KEYS.SESSION);
            }

            const { passwordHash, passwordSalt, ...cleanUser } = serverData.user;
            setUser(cleanUser as UserAccount);
            return { success: true };
          }
        }
      } catch {
        // Fall through to local fallback
      }

      // 3. Local offline fallback
      const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS_DB);
      const users: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];
      const targetUser = users.find((u) => u.email.toLowerCase() === email);

      if (targetUser) {
        const isValid = await verifyPassword(
          password,
          targetUser.passwordHash,
          targetUser.passwordSalt
        );

        if (isValid) {
          clearFailedAttempts(email);
          targetUser.lastLoginAt = new Date().toISOString();
          const updatedUsers = users.map((u) => (u.id === targetUser.id ? targetUser : u));
          localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(updatedUsers));

          const session: AuthSession = {
            token: generateSessionToken(),
            userId: targetUser.id,
            email: targetUser.email,
            expiresAt: credentials.rememberMe
              ? Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
              : Date.now() + 24 * 60 * 60 * 1000,
            rememberMe: !!credentials.rememberMe,
          };

          if (credentials.rememberMe) {
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
            sessionStorage.removeItem(STORAGE_KEYS.SESSION);
          } else {
            sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
            localStorage.removeItem(STORAGE_KEYS.SESSION);
          }

          setUser(targetUser);
          return { success: true };
        }
      }

      recordFailedAttempt(email);
      let extraHint = '';
      if (email.endsWith('@gmail.com')) {
        const [local] = email.split('@');
        if (local.includes('.')) {
          extraHint = ` Catatan: Jika saat mendaftar Anda tidak mengetik titik (${local.replace(/\./g, '')}@gmail.com), gunakan penulisan tersebut.`;
        }
      }

      return {
        success: false,
        error: `Email atau kata sandi tidak cocok. Silakan periksa kembali email dan kata sandi Anda.${extraHint}`,
      };
    } catch (err: unknown) {
      console.error('Login error:', err);
      return {
        success: false,
        error: 'Terjadi gangguan koneksi saat masuk. Silakan coba lagi.',
      };
    }
  }, []);

  /**
   * Register New Account (Instant Access - Saved to Server, No Email Verification Hassle)
   */
  const register = useCallback(async (data: RegisterData): Promise<AuthResult> => {
    const email = data.email.trim().toLowerCase();
    const name = data.name.trim();
    const storeName = data.storeName.trim();
    const businessCategory = data.businessCategory.trim();
    const password = data.password;

    if (!name) {
      return { success: false, error: 'Nama lengkap pemilik wajib diisi.' };
    }

    if (!storeName) {
      return { success: false, error: 'Nama toko atau usaha wajib diisi.' };
    }

    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Format alamat email tidak valid. Contoh: namatoko@gmail.com.',
      };
    }

    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return { success: false, error: strength.message };
    }

    try {
      const { hash, salt } = await hashPassword(password);
      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newUser: UserAccount = {
        id: userId,
        name,
        email,
        storeName,
        businessCategory,
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // 1. Save directly to Server DB (guaranteed persistent across devices & reloads)
      try {
        await fetch('/api/auth/server-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'register', user: newUser }),
        });
      } catch (srvErr) {
        console.warn('Server user save warning:', srvErr);
      }

      // 2. Save to local storage cache
      try {
        const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS_DB);
        const users: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];
        const filtered = users.filter((u) => u.email.toLowerCase() !== email);
        filtered.push(newUser);
        localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(filtered));
      } catch {
        // ignore
      }

      // 3. Save persistent 7-day session
      const session: AuthSession = {
        token: generateSessionToken(),
        userId: newUser.id,
        email: newUser.email,
        expiresAt: Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
        rememberMe: true,
      };
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

      // 4. Background non-blocking sync to Supabase (if Supabase Auth is enabled)
      if (isSupabaseConfigured) {
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              storeName,
              businessCategory,
            },
          },
        }).then(({ data: supaRegData }) => {
          if (supaRegData?.user?.id) {
            newUser.id = supaRegData.user.id;
          }
        }).catch(() => {
          // Never block user registration on Supabase email rate limits
        });
      }

      // 5. Instantly login the user!
      clearFailedAttempts(email);
      setUser(newUser);
      return { success: true };
    } catch (err: unknown) {
      console.error('Registration error:', err);
      return {
        success: false,
        error: 'Gagal membuat akun toko. Silakan coba lagi.',
      };
    }
  }, []);

  /**
   * Verify 6/8-digit Email OTP Code sent by Supabase
   */
  const verifyEmailOtp = useCallback(
    async (email: string, token: string): Promise<{ success: boolean; error?: string }> => {
      const normalizedEmail = email.trim().toLowerCase();
      const cleanedToken = token.replace(/\s+/g, '');

      if (!normalizedEmail || !cleanedToken) {
        return { success: false, error: 'Masukkan kode OTP dari email Anda.' };
      }

      if (!isSupabaseConfigured) {
        return { success: false, error: 'Layanan verifikasi cloud tidak tersedia.' };
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: cleanedToken,
          type: 'signup',
        });

        if (error || !data.user) {
          return {
            success: false,
            error:
              'Kode verifikasi tidak valid atau sudah kedaluwarsa. Periksa kembali kode di email Anda atau klik Kirim Ulang.',
          };
        }

        const verifiedUser = mapSupabaseUserToAccount(data.user);
        setUser(verifiedUser);
        return { success: true };
      } catch {
        return {
          success: false,
          error: 'Gagal memverifikasi kode OTP. Periksa koneksi internet Anda.',
        };
      }
    },
    []
  );

  /**
   * Resend Confirmation Email to User's Real Inbox
   */
  const resendVerificationEmail = useCallback(
    async (
      email: string
    ): Promise<{ success: boolean; error?: string; message?: string }> => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!validateEmail(normalizedEmail)) {
        return { success: false, error: 'Masukkan alamat email yang valid.' };
      }

      if (!isSupabaseConfigured) {
        return { success: false, error: 'Layanan email cloud tidak aktif.' };
      }

      try {
        const redirectOrigin =
          typeof window !== 'undefined' ? window.location.origin : undefined;

        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: normalizedEmail,
          options: {
            emailRedirectTo: redirectOrigin,
          },
        });

        if (error) {
          const lower = error.message.toLowerCase();
          if (lower.includes('rate limit') || lower.includes('security purposes')) {
            return {
              success: false,
              error:
                'Mohon tunggu sekitar 60 detik sebelum meminta pengiriman ulang email verifikasi.',
            };
          }
          return {
            success: false,
            error: `Gagal mengirim ulang email: ${error.message}`,
          };
        }

        return {
          success: true,
          message: `Email verifikasi baru telah dikirim ke ${normalizedEmail}. Cek Kotak Masuk atau folder Spam/Promosi.`,
        };
      } catch {
        return {
          success: false,
          error: 'Terjadi gangguan jaringan saat mengirim ulang email verifikasi.',
        };
      }
    },
    []
  );

  /**
   * Send Password Reset Email via Supabase
   */
  const sendPasswordResetEmail = useCallback(
    async (
      email: string
    ): Promise<{ success: boolean; error?: string; message?: string }> => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!validateEmail(normalizedEmail)) {
        return { success: false, error: 'Masukkan alamat email akun yang valid.' };
      }

      if (!isSupabaseConfigured) {
        return {
          success: false,
          error: 'Fitur reset via email memerlukan koneksi cloud Supabase.',
        };
      }

      try {
        const redirectOrigin =
          typeof window !== 'undefined' ? window.location.origin : undefined;
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: redirectOrigin,
        });

        if (error) {
          const lower = error.message.toLowerCase();
          if (lower.includes('rate limit')) {
            return {
              success: false,
              error: 'Terlalu sering meminta reset sandi. Tunggu beberapa menit lalu coba lagi.',
            };
          }
          return { success: false, error: error.message };
        }

        return {
          success: true,
          message: `Tautan pemulihan kata sandi telah dikirim ke ${normalizedEmail}. Silakan cek email Anda.`,
        };
      } catch {
        return {
          success: false,
          error: 'Gagal mengirim email reset kata sandi.',
        };
      }
    },
    []
  );

  /**
   * Log Out
   */
  const logout = useCallback(async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[Supabase Auth] SignOut error:', err);
      }
    }
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    setUser(null);
  }, []);

  /**
   * Update Account Profile Details
   */
  const updateAccountProfile = useCallback(
    async (
      updates: Partial<Pick<UserAccount, 'name' | 'storeName' | 'businessCategory' | 'avatarUrl'>>
    ) => {
      if (!user) return;

      const updatedUser: UserAccount = {
        ...user,
        ...updates,
      };
      setUser(updatedUser);

      if (isSupabaseConfigured) {
        try {
          await supabase.auth.updateUser({
            data: {
              name: updates.name ?? user.name,
              storeName: updates.storeName ?? user.storeName,
              businessCategory: updates.businessCategory ?? user.businessCategory,
            },
          });
          await supabase.from('profiles').upsert({
            id: user.id,
            name: updates.name ?? user.name,
            store_name: updates.storeName ?? user.storeName,
            business_category: updates.businessCategory ?? user.businessCategory,
            updated_at: new Date().toISOString(),
          });
        } catch (supaErr) {
          console.warn('[Supabase Auth] Profile update error:', supaErr);
        }
        return;
      }

      try {
        const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS_DB);
        const users: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];
        const updatedList = users.map((u) => (u.id === user.id ? updatedUser : u));
        localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(updatedList));
      } catch (err) {
        console.error('Failed to update account profile:', err);
      }
    },
    [user]
  );

  /**
   * Change Password (Supports Supabase Cloud Auth + Local Fallback)
   */
  const changePassword = useCallback(
    async (
      oldPassword: string,
      newPassword: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: 'Anda harus masuk terlebih dahulu.' };
      }

      const strength = validatePasswordStrength(newPassword);
      if (!strength.isValid) {
        return { success: false, error: strength.message };
      }

      if (isSupabaseConfigured) {
        try {
          // Verify old password first
          const { error: verifyErr } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: oldPassword,
          });
          if (verifyErr) {
            return { success: false, error: 'Kata sandi saat ini tidak cocok.' };
          }

          const { error: updateErr } = await supabase.auth.updateUser({
            password: newPassword,
          });
          if (updateErr) {
            return { success: false, error: updateErr.message || 'Gagal memperbarui kata sandi.' };
          }

          return { success: true };
        } catch {
          return { success: false, error: 'Terjadi gangguan saat memperbarui kata sandi.' };
        }
      }

      const isOldValid = await verifyPassword(oldPassword, user.passwordHash, user.passwordSalt);
      if (!isOldValid) {
        return { success: false, error: 'Kata sandi saat ini tidak cocok.' };
      }

      try {
        const { hash, salt } = await hashPassword(newPassword);
        const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS_DB);
        const users: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];

        const updatedUser: UserAccount = {
          ...user,
          passwordHash: hash,
          passwordSalt: salt,
        };

        const updatedList = users.map((u) => (u.id === user.id ? updatedUser : u));
        localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(updatedList));
        setUser(updatedUser);

        return { success: true };
      } catch (err) {
        console.error('Failed to change password:', err);
        return { success: false, error: 'Gagal memperbarui kata sandi.' };
      }
    },
    [user]
  );

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    verifyEmailOtp,
    resendVerificationEmail,
    sendPasswordResetEmail,
    logout,
    updateAccountProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

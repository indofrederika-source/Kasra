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
          // If redirected back with PKCE ?code=..., exchange it for a persistent session
          if (typeof window !== 'undefined') {
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
          } else {
            setUser(null);
          }

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
      if (isSupabaseConfigured) {
        const { data: supaLoginData, error: supaError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!supaError && supaLoginData.user && supaLoginData.session) {
          clearFailedAttempts(email);
          const loggedInUser = mapSupabaseUserToAccount(supaLoginData.user);
          setUser(loggedInUser);
          return { success: true };
        }

        const errLower = (supaError?.message || '').toLowerCase();

        // Crucial: Account already exists in Supabase, just waiting for email verification!
        if (errLower.includes('email not confirmed')) {
          return {
            success: false,
            requiresEmailVerification: true,
            email,
            error:
              'Akun Anda sudah terdaftar, tetapi email belum dikonfirmasi! Silakan klik link verifikasi atau masukkan kode dari email Anda.',
          };
        }

        if (errLower.includes('invalid login credentials')) {
          recordFailedAttempt(email);
          return {
            success: false,
            error:
              'Email belum terdaftar atau kata sandi salah. Periksa kembali penulisan email dan huruf besar/kecil kata sandi Anda.',
          };
        }

        if (errLower.includes('rate limit') || errLower.includes('too many requests')) {
          return {
            success: false,
            error: 'Terlalu banyak permintaan login ke server. Tunggu sebentar lalu coba kembali.',
          };
        }

        return {
          success: false,
          error: supaError?.message || 'Gagal masuk ke akun. Periksa koneksi internet Anda.',
        };
      }

      // Offline / No-Supabase fallback
      const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS_DB);
      const users: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];

      const targetUser = users.find((u) => u.email.toLowerCase() === email);
      if (!targetUser) {
        recordFailedAttempt(email);
        return { success: false, error: 'Email atau kata sandi tidak sesuai.' };
      }

      const isValid = await verifyPassword(
        password,
        targetUser.passwordHash,
        targetUser.passwordSalt
      );

      if (!isValid) {
        recordFailedAttempt(email);
        return { success: false, error: 'Email atau kata sandi tidak sesuai.' };
      }

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
    } catch (err: unknown) {
      console.error('Login error:', err);
      return {
        success: false,
        error: 'Terjadi gangguan jaringan saat memverifikasi akun. Silakan coba lagi.',
      };
    }
  }, []);

  /**
   * Register New Account (Requires Real Active Email Domain + Real Email Confirmation)
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
      return { success: false, error: 'Nama toko atau bisnis wajib diisi.' };
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

    // Step 1: Verify on server via DNS MX lookup that the email domain REALLY exists & receives mail
    const emailCheck = await verifyRealEmailOnServer(email);
    if (!emailCheck.valid) {
      return {
        success: false,
        suggestedEmail: emailCheck.suggestion,
        error:
          emailCheck.reason ||
          'Alamat email tidak valid atau domain email tidak aktif. Gunakan email asli yang benar-benar ada.',
      };
    }

    try {
      if (isSupabaseConfigured) {
        const redirectOrigin =
          typeof window !== 'undefined' ? window.location.origin : undefined;

        const { data: supaRegData, error: supaError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectOrigin,
            data: {
              name,
              storeName,
              businessCategory,
            },
          },
        });

        if (supaError) {
          const msgLower = supaError.message.toLowerCase();
          if (msgLower.includes('already registered') || msgLower.includes('already exists')) {
            return {
              success: false,
              alreadyRegistered: true,
              email,
              error:
                'Alamat email ini sudah terdaftar! Silakan langsung masuk di tab Masuk Akun, atau konfirmasi email Anda.',
            };
          }
          if (msgLower.includes('rate limit') || msgLower.includes('over_email_send_rate_limit')) {
            return {
              success: false,
              error:
                'Batas pengiriman email verifikasi tercapai sementara. Silakan cek kotak masuk/Spam Anda dari pendaftaran sebelumnya, atau coba lagi beberapa menit lagi.',
            };
          }
          if (msgLower.includes('invalid') || msgLower.includes('unable to validate')) {
            return {
              success: false,
              error:
                'Alamat email ditolak karena tidak valid. Gunakan email aktif yang benar-benar ada.',
            };
          }
          return {
            success: false,
            error: `Gagal mendaftarkan email: ${supaError.message}`,
          };
        }

        // Detect obfuscated duplicate signup when Supabase "Confirm email" is enabled (identities === [])
        if (
          supaRegData.user &&
          Array.isArray(supaRegData.user.identities) &&
          supaRegData.user.identities.length === 0
        ) {
          return {
            success: false,
            alreadyRegistered: true,
            email,
            error:
              'Email ini sudah terdaftar di KASRA! Silakan masuk di tab Masuk Akun (jika belum klik verifikasi, Anda bisa kirim ulang email verifikasi saat masuk).',
          };
        }

        // Case A: Supabase requires real email inbox confirmation (session is null until verified)
        if (supaRegData.user && !supaRegData.session) {
          return {
            success: true,
            requiresEmailVerification: true,
            email,
          };
        }

        // Case B: Session immediately active (e.g. if Confirm Email was turned off on Supabase)
        if (supaRegData.user && supaRegData.session) {
          const newUser = mapSupabaseUserToAccount(supaRegData.user);
          setUser(newUser);
          return { success: true };
        }

        return {
          success: false,
          error: 'Pendaftaran tidak dapat diselesaikan. Silakan coba lagi.',
        };
      }

      // Offline / No-Supabase fallback
      const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS_DB);
      const users: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];

      const existing = users.find((u) => u.email.toLowerCase() === email);
      if (existing) {
        return {
          success: false,
          alreadyRegistered: true,
          email,
          error: 'Alamat email ini sudah terdaftar. Silakan langsung masuk.',
        };
      }

      const { hash, salt } = await hashPassword(password);
      const newUser: UserAccount = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name,
        email,
        storeName,
        businessCategory,
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));

      const session: AuthSession = {
        token: generateSessionToken(),
        userId: newUser.id,
        email: newUser.email,
        expiresAt: Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
        rememberMe: true,
      };
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

      setUser(newUser);
      return { success: true };
    } catch (err: unknown) {
      console.error('Registration error:', err);
      return {
        success: false,
        error: 'Gagal membuat akun baru karena gangguan jaringan. Silakan coba lagi.',
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

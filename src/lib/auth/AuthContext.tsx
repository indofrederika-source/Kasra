'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  UserAccount,
  AuthSession,
  LoginCredentials,
  RegisterData,
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore active session on mount (Supabase session first, then local fallback)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured) {
          try {
            const { data: supaSession } = await supabase.auth.getSession();
            if (supaSession?.session?.user) {
              const supaUser = supaSession.session.user;
              const meta = supaUser.user_metadata || {};
              const restoredUser: UserAccount = {
                id: supaUser.id,
                email: supaUser.email || '',
                name: meta.name || 'Pemilik Toko',
                storeName: meta.storeName || 'Toko Saya',
                businessCategory: meta.businessCategory || '',
                passwordHash: '',
                passwordSalt: '',
                createdAt: supaUser.created_at || new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
              };
              setUser(restoredUser);
              setIsLoading(false);
              return;
            }
          } catch (supaErr) {
            console.warn('[Supabase Auth] Session restore fallback to local:', supaErr);
          }
        }

        let users: UserAccount[] = [];
        const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS_DB);

        if (rawUsers) {
          try {
            users = JSON.parse(rawUsers);
          } catch {
            users = [];
          }
        }

        // Restore Session
        const rawSession =
          localStorage.getItem(STORAGE_KEYS.SESSION) ||
          sessionStorage.getItem(STORAGE_KEYS.SESSION);

        if (rawSession) {
          const session: AuthSession = JSON.parse(rawSession);
          const now = Date.now();

          if (session.expiresAt > now) {
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
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Helper to check lockout
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
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
      const email = credentials.email.trim().toLowerCase();
      const password = credentials.password;

      if (!email || !password) {
        return { success: false, error: 'Email dan kata sandi wajib diisi.' };
      }

      const lockout = checkBruteForceLockout(email);
      if (lockout.locked) {
        return {
          success: false,
          error: `Terlalu banyak percobaan gagal. Akun sementara dibatasi, coba lagi dalam ${lockout.waitSeconds} detik.`,
        };
      }

      try {
        // 1. Try Supabase Auth First
        if (isSupabaseConfigured) {
          try {
            const { data: supaLoginData, error: supaError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (!supaError && supaLoginData.user) {
              clearFailedAttempts(email);
              const meta = supaLoginData.user.user_metadata || {};
              const loggedInUser: UserAccount = {
                id: supaLoginData.user.id,
                email: supaLoginData.user.email || email,
                name: meta.name || 'Pemilik Toko',
                storeName: meta.storeName || 'Toko Saya',
                businessCategory: meta.businessCategory || '',
                passwordHash: '',
                passwordSalt: '',
                createdAt: supaLoginData.user.created_at || new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
              };
              setUser(loggedInUser);
              return { success: true };
            } else if (supaError && supaError.message.toLowerCase().includes('invalid login credentials')) {
              recordFailedAttempt(email);
              return { success: false, error: 'Email atau kata sandi tidak sesuai.' };
            }
          } catch (supaErr) {
            console.warn('[Supabase Auth] Login fallback to local:', supaErr);
          }
        }

        // 2. Local fallback
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

        const token = generateSessionToken();
        const expiresAt = credentials.rememberMe
          ? Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
          : Date.now() + 24 * 60 * 60 * 1000;

        const session: AuthSession = {
          token,
          userId: targetUser.id,
          email: targetUser.email,
          expiresAt,
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
          error: 'Terjadi gangguan saat memverifikasi akun. Silakan coba lagi.',
        };
      }
    },
    []
  );

  /**
   * Register New Account
   */
  const register = useCallback(
    async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
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
        return { success: false, error: 'Format alamat email tidak valid.' };
      }

      const strength = validatePasswordStrength(password);
      if (!strength.isValid) {
        return { success: false, error: strength.message };
      }

      try {
        // 1. Try Supabase Auth First
        if (isSupabaseConfigured) {
          try {
            const { data: supaRegData, error: supaError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  name,
                  storeName,
                  businessCategory,
                },
              },
            });

            if (!supaError && supaRegData.user) {
              const newUser: UserAccount = {
                id: supaRegData.user.id,
                name,
                email,
                storeName,
                businessCategory,
                passwordHash: '',
                passwordSalt: '',
                createdAt: supaRegData.user.created_at || new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
              };
              setUser(newUser);
              return { success: true };
            } else if (supaError) {
              console.warn('[Supabase Auth] SignUp warning, falling back to local storage:', supaError.message);
              if (supaError.message.toLowerCase().includes('already registered')) {
                return {
                  success: false,
                  error: 'Alamat email ini sudah terdaftar di database cloud. Silakan langsung masuk.',
                };
              }
            }
          } catch (supaErr) {
            console.warn('[Supabase Auth] SignUp fallback:', supaErr);
          }
        }

        // 2. Local registration fallback
        const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS_DB);
        const users: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];

        const existing = users.find((u) => u.email.toLowerCase() === email);
        if (existing) {
          return {
            success: false,
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

        const token = generateSessionToken();
        const session: AuthSession = {
          token,
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
          error: 'Gagal membuat akun baru. Silakan coba lagi.',
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
    async (updates: Partial<Pick<UserAccount, 'name' | 'storeName' | 'businessCategory' | 'avatarUrl'>>) => {
      if (!user) return;

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
      }

      try {
        const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS_DB);
        const users: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];

        const updatedUser: UserAccount = {
          ...user,
          ...updates,
        };

        const updatedList = users.map((u) => (u.id === user.id ? updatedUser : u));
        localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(updatedList));
        setUser(updatedUser);
      } catch (err) {
        console.error('Failed to update account profile:', err);
      }
    },
    [user]
  );

  /**
   * Change Password
   */
  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: 'Anda harus masuk terlebih dahulu.' };
      }

      const isOldValid = await verifyPassword(oldPassword, user.passwordHash, user.passwordSalt);
      if (!isOldValid) {
        return { success: false, error: 'Kata sandi saat ini tidak cocok.' };
      }

      const strength = validatePasswordStrength(newPassword);
      if (!strength.isValid) {
        return { success: false, error: strength.message };
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

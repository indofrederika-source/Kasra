export interface UserAccount {
  id: string;
  name: string;
  email: string;
  storeName: string;
  businessCategory: string;
  avatarUrl?: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  email: string;
  expiresAt: number; // timestamp in ms
  rememberMe: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  storeName: string;
  businessCategory: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  requiresEmailVerification?: boolean;
  alreadyRegistered?: boolean;
  email?: string;
  suggestedEmail?: string;
}

export interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => void;
  updateAccountProfile: (updates: Partial<Pick<UserAccount, 'name' | 'storeName' | 'businessCategory' | 'avatarUrl'>>) => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

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

export interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateAccountProfile: (updates: Partial<Pick<UserAccount, 'name' | 'storeName' | 'businessCategory' | 'avatarUrl'>>) => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

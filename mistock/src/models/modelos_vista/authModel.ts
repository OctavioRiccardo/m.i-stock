export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  avatarUrl?: string;
}

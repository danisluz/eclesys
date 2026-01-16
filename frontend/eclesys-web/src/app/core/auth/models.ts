export type UserRole = 'ADMIN' | 'SECRETARIA' | 'LIDER';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  tenantCode?: string;
  tenantName?: string;
};

export type LoginRequest = {
  tenantCode: string;
  email: string;
  password: string;
  antiBotToken: string | null;
};

export type ApiSuccessResponse<T> = {
  status: 'success';
  data: T;
  message: string | null;
};

export type LoginData = {
  token: string;
};

export type LoginResponse = ApiSuccessResponse<LoginData>;


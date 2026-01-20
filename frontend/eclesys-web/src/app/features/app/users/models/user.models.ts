export type UserRole = 'ADMIN' | 'SECRETARIA' | 'LIDER';

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface ApiSuccess<T> {
  status: 'success';
  data: T;
}

export interface ApiError {
  status: 'error';
  message: string;
}

export interface PaginatedResult<T> {
  totalPages: number;
  page: number;
  size: number;
  items: T[];
  totalItems: number;
}


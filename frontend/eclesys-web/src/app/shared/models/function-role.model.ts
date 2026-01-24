export type ScopeType = 'UNIT' | 'MINISTRY' | 'BOTH';

export interface FunctionRole {
  id: string;
  name: string;
  scopeType: ScopeType;
  maxHolders: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFunctionRoleRequest {
  name: string;
  scopeType: ScopeType;
  maxHolders?: number | null;
  sortOrder: number;
  isActive?: boolean;
}

export interface UpdateFunctionRoleRequest {
  name?: string;
  scopeType?: ScopeType;
  maxHolders?: number | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ChurchRole {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChurchRoleRequest {
  name: string;
  sortOrder: number;
  isActive?: boolean;
}

export interface UpdateChurchRoleRequest {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}

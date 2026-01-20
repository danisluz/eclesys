import { inject, Injectable, signal } from '@angular/core';
import { UsersApi } from './users.api';
import { CreateUserRequest, UserDto } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UsersStore {
  usersApi = inject(UsersApi);

  users = signal<UserDto[]>([]);

  isListLoading = signal(false);
  isCreateLoading = signal(false);

  listErrorMessage = signal<string | null>(null);
  createErrorMessage = signal<string | null>(null);

  clearListError(): void {
    this.listErrorMessage.set(null);
  }

  clearCreateError(): void {
    this.createErrorMessage.set(null);
  }

  async loadUsers(): Promise<void> {
    this.isListLoading.set(true);
    this.listErrorMessage.set(null);

    try {
      const users = await this.usersApi.listUsers();
      this.users.set(Array.isArray(users) ? users : []);
    } catch (error: any) {
      this.listErrorMessage.set(
        this.parseErrorMessage(error, 'Não foi possível carregar usuários.'),
      );
    } finally {
      this.isListLoading.set(false);
    }
  }

  async createUser(request: CreateUserRequest): Promise<UserDto | null> {
    this.isCreateLoading.set(true);
    this.createErrorMessage.set(null);

    try {
      const createdUser = await this.usersApi.createUser(request);

      // ✅ se criou com sucesso, não deixa erro antigo de listagem "mascarar" a UI
      this.listErrorMessage.set(null);

      // update otimista
      this.users.update((currentUsers) => [createdUser, ...currentUsers]);

      return createdUser;
    } catch (error: any) {
      this.createErrorMessage.set(
        this.parseErrorMessage(error, 'Não foi possível criar o usuário.'),
      );
      return null;
    } finally {
      this.isCreateLoading.set(false);
    }
  }

  private parseErrorMessage(error: any, fallbackMessage: string): string {
    const apiMessage = error?.error?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
      return apiMessage;
    }
    return fallbackMessage;
  }

  async updateStatus(userId: string, isActive: boolean): Promise<boolean> {
    this.listErrorMessage.set(null);

    try {
      const updatedUser = await this.usersApi.updateUser(userId, { isActive });

      this.users.update((currentUsers) =>
        currentUsers.map((user) => (user.id === userId ? updatedUser : user)),
      );

      return true;
    } catch (error: any) {
      this.listErrorMessage.set(
        this.parseErrorMessage(
          error,
          'Não foi possível atualizar o status do usuário.',
        ),
      );
      return false;
    }
  }

  resetPasswordErrorMessage = signal<string | null>(null);
  isResetPasswordLoading = signal(false);

  clearResetPasswordError(): void {
    this.resetPasswordErrorMessage.set(null);
  }

  setResetPasswordError(message: string): void {
    this.resetPasswordErrorMessage.set(message);
  }

  async resetUserPassword(
    userId: string,
    newPassword: string,
  ): Promise<boolean> {
    this.isResetPasswordLoading.set(true);
    this.resetPasswordErrorMessage.set(null);

    try {
      await this.usersApi.resetPassword(userId, newPassword);
      return true;
    } catch (error: any) {
      this.resetPasswordErrorMessage.set(
        this.parseErrorMessage(error, 'Não foi possível redefinir a senha.'),
      );
      return false;
    } finally {
      this.isResetPasswordLoading.set(false);
    }
  }
}

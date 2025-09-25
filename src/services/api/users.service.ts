import { apiClient } from './client';

export enum UserRole {
  ADMIN = 'admin',
  TRAFFIC_MANAGER = 'traffic_manager',
  CHEF_PROJET = 'chef_projet',
  DIRECTION = 'direction',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  memberId?: string;
  lastLogin?: Date;
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  memberId?: string;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  memberId?: string | null;
}

export interface UsersResponse {
  users: User[];
  total: number;
  pages: number;
}

export interface ResetPasswordResponse {
  temporaryPassword: string;
  note: string;
}

class UsersService {
  /**
   * Get all users with pagination
   */
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<UsersResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const response = await apiClient.get(`/auth/users?${queryParams}`);
    
    return {
      users: response.data.data,
      total: response.data.meta.total,
      pages: response.data.meta.pages,
    };
  }

  /**
   * Create a new user
   */
  async createUser(data: CreateUserInput): Promise<User> {
    const response = await apiClient.post('/auth/users', data);
    return response.data.data;
  }

  /**
   * Update an existing user
   */
  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    const response = await apiClient.put(`/auth/users/${id}`, data);
    return response.data.data;
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/auth/users/${id}`);
  }

  /**
   * Reset user password (admin only)
   */
  async resetPassword(id: string): Promise<ResetPasswordResponse> {
    const response = await apiClient.patch(`/auth/users/${id}/reset-password`);
    return response.data.data;
  }
}

export const usersService = new UsersService();
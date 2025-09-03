// Types TypeScript pour l'API Matter Traffic

// Types de base
export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

// Types pour les tâches
export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  projectId: string;
  assigneeId?: string;
  notionId?: string;
}

// Types pour les projets
export interface Project extends BaseEntity {
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  color?: string;
  notionId?: string;
}

// Types pour les utilisateurs
export interface User extends BaseEntity {
  name: string;
  email: string;
  avatar?: string;
  notionUserId?: string;
  role: 'admin' | 'user' | 'viewer';
}

// Types pour l'authentification
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Types pour les erreurs
export interface ApiError {
  message: string;
  code?: string;
  status: number;
  details?: Record<string, any>;
}

// Types pour les filtres et recherche
export interface TaskFilters {
  status?: Task['status'];
  priority?: Task['priority'];
  projectId?: string;
  assigneeId?: string;
  search?: string;
  dueBefore?: string;
  dueAfter?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Types pour les webhooks Notion
export interface NotionWebhook {
  id: string;
  type: 'page_created' | 'page_updated' | 'page_deleted';
  page: {
    id: string;
    properties: Record<string, any>;
  };
  timestamp: string;
}
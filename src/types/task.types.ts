// Types centralisés pour les tâches
// Utilisé dans toute l'application frontend

export interface Task {
  id: string;
  title: string;
  workPeriod?: {
    startDate: string; // ISO 8601 format avec heure
    endDate: string;   // ISO 8601 format avec heure
  };
  assignedMembers?: string[];
  assignedMembersData?: Array<{
    id: string;
    name: string;
    email: string;
    teams?: string[];
  }>;
  projectId?: string;
  projectData?: {
    id: string;
    name: string;
    status: string;
  };
  clientId?: string;
  clientData?: {
    id: string;
    name: string;
  };
  teams?: string[];
  teamsData?: Array<{
    id: string;
    name: string;
  }>;
  involvedTeamIds?: string[];
  involvedTeamsData?: Array<{
    id: string;
    name: string;
  }>;
  taskType?: 'task' | 'holiday' | 'remote' | 'school';
  status: 'not_started' | 'in_progress' | 'completed' | 'Pas Commencé' | 'A valider' | 'Terminé' | string;
  description?: string;
  notes?: string;
  billedHours?: number;
  actualHours?: number;
  createdAt?: string;
  updatedAt?: string;
  syncedAt?: string;
  
  // Champs ajoutés côté client
  _pendingSync?: boolean; // Indique que la tâche est en attente de sync avec Notion
  _optimisticId?: string; // ID temporaire pour les créations optimistes
}

// Types pour les conflits
export interface TaskConflict {
  type: 'overlap' | 'holiday' | 'school' | 'overload';
  message: string;
  memberId: string;
  memberName?: string;
  conflictingTaskId?: string;
  conflictingTaskTitle?: string;
  severity: 'low' | 'medium' | 'high';
  details?: {
    date?: string;
    duration?: number;
    overlappingHours?: number;
  };
}

// Extension du type Task avec les conflits
export interface TaskWithConflicts extends Task {
  conflicts?: TaskConflict[];
}

// Réponse du backend pour les tâches avec conflits
export interface TaskResponse {
  success: boolean;
  data: Task;
  conflicts?: TaskConflict[];
  syncStatus?: {
    synced: boolean;
    lastSync: string;
    conflicts: {
      hasConflicts: boolean;
      conflictId?: string;
      severity?: string;
      detectedAt?: string;
      count?: number;
    };
  };
  meta?: {
    cached?: boolean;
    timestamp?: string;
  };
}

// Réponse pour le calendrier
export interface CalendarTasksResponse {
  success: boolean;
  data: {
    tasks: Task[];
    cacheHit: boolean;
    period: {
      start: string;
      end: string;
    };
  };
  meta: {
    count: number;
    cached: boolean;
    timestamp: string;
  };
}

// Réponse pour les tests Notion
export interface NotionTestResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Statistiques des tâches
export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  byType: {
    task: number;
    holiday: number;
    school: number;
    remote: number;
  };
}
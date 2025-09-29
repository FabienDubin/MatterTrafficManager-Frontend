import { EventInput } from '@fullcalendar/core';
import { Task } from '@/types/task.types';
import { formatTaskTitle } from './taskFormatter';
import { FieldType } from '@/store/calendar-config.store';

/**
 * Convert a Task object to a FullCalendar EventInput
 */
export function taskToCalendarEvent(
  task: Task,
  viewConfig?: { fields: FieldType[]; maxTitleLength?: number }
): EventInput {
  // Determine event color based on status
  // const color = getStatusColor(task.status); // Géré dans TaskCard maintenant
  
  // Ensure we have valid dates
  const startDate = task.workPeriod?.startDate || new Date().toISOString();
  const endDate = task.workPeriod?.endDate || 
    new Date(new Date(startDate).getTime() + 3600000).toISOString(); // Default 1 hour duration
  
  // Format title based on view configuration
  const title = viewConfig 
    ? formatTaskTitle(task, viewConfig.fields, viewConfig.maxTitleLength)
    : task.title;
  
  return {
    id: task.id,
    title,
    start: startDate,
    end: endDate,
    // Retirer les couleurs, on les gère dans TaskCard avec le thème
    extendedProps: {
      task, // Passer la tâche complète pour le rendu personnalisé
      status: task.status,
      description: task.description || '',
      notes: task.notes || '',
      assignedMembers: task.assignedMembers || [],
      assignedMembersData: task.assignedMembersData || [],
      projectId: task.projectId,
      projectData: task.projectData,
      clientId: task.clientId,
      clientData: task.clientData,
      teams: task.teams || [],
      teamsData: task.teamsData || [],
      involvedTeamIds: task.involvedTeamIds || [],
      involvedTeamsData: task.involvedTeamsData || [],
      conflicts: task.conflicts || [], // Ajouter les conflits
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    },
    // Make events editable based on status
    editable: task.status !== 'completed',
    // Allow drag and drop for non-completed tasks
    startEditable: task.status !== 'completed',
    durationEditable: task.status !== 'completed',
  };
}

/**
 * Convert an array of Tasks to FullCalendar EventInputs
 */
export function tasksToCalendarEvents(
  tasks: Task[],
  viewConfig?: { fields: FieldType[]; maxTitleLength?: number }
): EventInput[] {
  return tasks.map(task => taskToCalendarEvent(task, viewConfig));
}

/**
 * Get color based on task status
 */
export function getStatusColor(status: string | undefined | null): string {
  // Handle case insensitive status values
  const normalizedStatus = status?.toLowerCase();
  
  switch (normalizedStatus) {
    case 'terminé':
    case 'completed':
      return '#10b981'; // Emerald 500 - Green for completed
    case 'a valider':
    case 'in_progress':
      return '#f59e0b'; // Amber 500 - Orange for validation needed
    case 'pas commencé':
    case 'not_started':
      return '#6b7280'; // Gray 500 - Gray for not started
    default:
      return '#3b82f6'; // Blue 500 - Default blue
  }
}

/**
 * Get status label in French
 */
export function getStatusLabel(status: string | undefined | null): string {
  // Handle Notion status values (in French) - case insensitive
  const normalizedStatus = status?.toLowerCase();
  
  switch (normalizedStatus) {
    case 'terminé':
    case 'completed':
      return 'Terminé';
    case 'a valider':
    case 'in_progress':
      return 'A valider';
    case 'pas commencé':
    case 'not_started':
      return 'Pas commencé';
    default:
      return status || 'Inconnu';
  }
}

/**
 * Format task for display in tooltip or modal
 */
export function formatTaskForDisplay(task: Task): string {
  const parts = [
    `Titre: ${task.title}`,
    `Statut: ${getStatusLabel(task.status)}`,
  ];
  
  if (task.description) {
    parts.push(`Description: ${task.description}`);
  }
  
  // Use enriched member data if available, fallback to IDs
  if (task.assignedMembersData && task.assignedMembersData.length > 0) {
    const memberNames = task.assignedMembersData.map(m => m.name).join(', ');
    parts.push(`Assigné à: ${memberNames}`);
  } else if (task.assignedMembers && task.assignedMembers.length > 0) {
    parts.push(`Assigné à: ${task.assignedMembers.join(', ')}`);
  }
  
  // Show project name if available
  if (task.projectData) {
    parts.push(`Projet: ${task.projectData.name}`);
  }
  
  // Show client name if available
  if (task.clientData) {
    parts.push(`Client: ${task.clientData.name}`);
  }
  
  // Show team names if available
  if (task.teamsData && task.teamsData.length > 0) {
    const teamNames = task.teamsData.map(t => t.name).join(', ');
    parts.push(`Équipes: ${teamNames}`);
  }
  
  if (task.workPeriod) {
    const start = new Date(task.workPeriod.startDate);
    const end = new Date(task.workPeriod.endDate);
    parts.push(`Début: ${start.toLocaleString('fr-FR')}`);
    parts.push(`Fin: ${end.toLocaleString('fr-FR')}`);
  }
  
  return parts.join('\n');
}
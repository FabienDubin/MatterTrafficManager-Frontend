import { EventInput } from '@fullcalendar/core';
import { Task } from '@/services/api/tasks.service';

/**
 * Convert a Task object to a FullCalendar EventInput
 */
export function taskToCalendarEvent(task: Task): EventInput {
  // Determine event color based on status
  const color = getStatusColor(task.status);
  
  // Ensure we have valid dates
  const startDate = task.workPeriod?.startDate || new Date().toISOString();
  const endDate = task.workPeriod?.endDate || 
    new Date(new Date(startDate).getTime() + 3600000).toISOString(); // Default 1 hour duration
  
  return {
    id: task.id,
    title: task.title,
    start: startDate,
    end: endDate,
    backgroundColor: color,
    borderColor: color,
    textColor: '#ffffff',
    extendedProps: {
      status: task.status,
      description: task.description || '',
      assignedMembers: task.assignedMembers || [],
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
export function tasksToCalendarEvents(tasks: Task[]): EventInput[] {
  return tasks.map(taskToCalendarEvent);
}

/**
 * Get color based on task status
 */
export function getStatusColor(status: Task['status']): string {
  switch (status) {
    case 'completed':
      return '#10b981'; // Emerald 500 - Green for completed
    case 'in_progress':
      return '#3b82f6'; // Blue 500 - Blue for in progress
    case 'not_started':
    default:
      return '#6b7280'; // Gray 500 - Gray for not started
  }
}

/**
 * Get status label in French
 */
export function getStatusLabel(status: Task['status']): string {
  switch (status) {
    case 'completed':
      return 'Terminé';
    case 'in_progress':
      return 'En cours';
    case 'not_started':
      return 'Non commencé';
    default:
      return 'Inconnu';
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
  
  if (task.assignedMembers && task.assignedMembers.length > 0) {
    parts.push(`Assigné à: ${task.assignedMembers.join(', ')}`);
  }
  
  if (task.workPeriod) {
    const start = new Date(task.workPeriod.startDate);
    const end = new Date(task.workPeriod.endDate);
    parts.push(`Début: ${start.toLocaleString('fr-FR')}`);
    parts.push(`Fin: ${end.toLocaleString('fr-FR')}`);
  }
  
  return parts.join('\n');
}
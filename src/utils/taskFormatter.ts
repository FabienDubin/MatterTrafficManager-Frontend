import { Task } from '@/types/task.types';
import { FieldType } from '@/store/calendar-config.store';

/**
 * Format task title based on configured fields for calendar display
 */
export function formatTaskTitle(
  task: Task,
  fields: FieldType[],
  maxLength?: number
): string {
  const parts: string[] = [];

  // Always include the title first if it's in the fields
  if (fields.includes('title')) {
    parts.push(task.title);
  }

  // Add other fields
  fields.forEach((field) => {
    switch (field) {
      case 'project':
        if (task.projectData?.name && field !== 'title') {
          parts.push(`[${task.projectData.name}]`);
        }
        break;

      case 'client':
        if (task.clientData?.name && field !== 'title') {
          parts.push(`(${task.clientData.name})`);
        }
        break;

      case 'member':
        if (task.assignedMembersData && task.assignedMembersData.length > 0) {
          const memberNames = task.assignedMembersData
            .slice(0, 2) // Limit to 2 members for space
            .map(m => m.name?.split(' ')[0]) // First name only
            .join(', ');
          if (memberNames) {
            parts.push(`👤 ${memberNames}`);
          }
        }
        break;

      case 'status':
        if (task.status) {
          // Short status indicators
          const statusIcon = getStatusIcon(task.status);
          if (statusIcon) {
            parts.push(statusIcon);
          }
        }
        break;

      case 'teams':
        if (task.teamsData && task.teamsData.length > 0) {
          const teamNames = task.teamsData
            .slice(0, 1) // Just first team for space
            .map(t => t.name)
            .join(', ');
          if (teamNames) {
            parts.push(`🏢 ${teamNames}`);
          }
        }
        break;

      case 'notes':
        // Notes are typically too long for calendar display
        // Just indicate if notes exist
        if (task.notes) {
          parts.push('📝');
        }
        break;
    }
  });

  // Join all parts
  let formatted = parts.join(' ');

  // Apply max length truncation if specified
  if (maxLength && formatted.length > maxLength) {
    formatted = formatted.substring(0, maxLength - 3) + '...';
  }

  return formatted || task.title; // Fallback to title if nothing else
}

/**
 * Get a short status icon for compact display
 */
function getStatusIcon(status: string): string {
  const normalizedStatus = status?.toLowerCase();
  
  switch (normalizedStatus) {
    case 'terminé':
    case 'completed':
      return '✅';
    case 'a valider':
    case 'in_progress':
      return '🔄';
    case 'pas commencé':
    case 'not_started':
      return '⏸️';
    default:
      return '';
  }
}

/**
 * Format task for DayView display (more detailed)
 */
export function formatTaskForDayView(
  task: Task,
  fields: FieldType[],
  maxTitleLength?: number
): {
  title: string;
  subtitle?: string;
  badges?: string[];
} {
  const result: {
    title: string;
    subtitle?: string;
    badges?: string[];
  } = {
    title: task.title,
    badges: []
  };

  // Apply title truncation
  if (maxTitleLength && result.title.length > maxTitleLength) {
    result.title = result.title.substring(0, maxTitleLength - 3) + '...';
  }

  // Build subtitle from configured fields
  const subtitleParts: string[] = [];
  
  fields.forEach((field) => {
    switch (field) {
      case 'project':
        if (task.projectData?.name) {
          subtitleParts.push(task.projectData.name);
        }
        break;

      case 'client':
        if (task.clientData?.name) {
          result.badges?.push(task.clientData.name);
        }
        break;

      case 'member':
        if (task.assignedMembersData && task.assignedMembersData.length > 0) {
          const members = task.assignedMembersData
            .map(m => m.name)
            .join(', ');
          subtitleParts.push(members);
        }
        break;

      case 'status':
        if (task.status) {
          result.badges?.push(getStatusLabel(task.status));
        }
        break;

      case 'teams':
        if (task.teamsData && task.teamsData.length > 0) {
          const teams = task.teamsData
            .map(t => t.name)
            .join(', ');
          result.badges?.push(teams);
        }
        break;

      case 'notes':
        if (task.notes) {
          // For day view, we can show a truncated note
          const truncatedNote = task.notes.length > 50 
            ? task.notes.substring(0, 50) + '...'
            : task.notes;
          subtitleParts.push(truncatedNote);
        }
        break;
    }
  });

  if (subtitleParts.length > 0) {
    result.subtitle = subtitleParts.join(' • ');
  }

  return result;
}

/**
 * Get status label in French (copied from taskMapper for consistency)
 */
function getStatusLabel(status: string | undefined | null): string {
  const normalizedStatus = status?.toLowerCase();
  
  switch (normalizedStatus) {
    case 'terminé':
    case 'completed':
      return 'Terminé';
    case 'a valider':
    case 'in_progress':
      return 'À valider';
    case 'pas commencé':
    case 'not_started':
      return 'Pas commencé';
    default:
      return status || 'Inconnu';
  }
}
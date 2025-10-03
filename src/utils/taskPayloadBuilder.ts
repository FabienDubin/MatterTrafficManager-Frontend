import { Task } from '@/types/task.types';
import { TaskEditFormData } from '@/schemas/taskEdit.schema';
import { Project } from '@/services/api/projects.service';
import { Member } from '@/services/api/members.service';
import { TaskCreatePayload } from '@/hooks/useOptimisticTaskCreate';

export interface BuildCreatePayloadOptions {
  formData: TaskEditFormData;
  projects: Project[];
  members: Member[];
}

export interface BuildUpdatePayloadOptions {
  formData: TaskEditFormData;
  originalTask: Task;
  projects: Project[];
  members: Member[];
}

/**
 * Build payload for task creation with enriched data
 */
export function buildCreatePayload({
  formData,
  projects,
  members
}: BuildCreatePayloadOptions): TaskCreatePayload {
  // Build date/time
  const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
  const startDateTime = new Date(formData.startDate!);
  startDateTime.setHours(startHours, startMinutes, 0, 0);

  const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
  const endDateTime = new Date(formData.endDate!);
  endDateTime.setHours(endHours, endMinutes, 0, 0);

  // Find project for enrichment
  const selectedProject = projects.find(p => p.id === formData.projectId);

  // Enrich members data
  const enrichedMembers = formData.assignedMembers
    ?.map(memberId => {
      const member = members.find(m => m.id === memberId);
      return member
        ? {
            id: member.id,
            name: member.name,
            email: member.email,
            teams: member.teams,
          }
        : null;
    })
    .filter(Boolean) as Array<{
      id: string;
      name: string;
      email: string;
      teams?: string[];
    }>;

  return {
    title: formData.title,
    projectId: formData.projectId,
    projectData: selectedProject
      ? {
          id: selectedProject.id,
          name: selectedProject.name,
          status: selectedProject.status,
        }
      : undefined,
    clientId: selectedProject?.client || undefined,
    clientData:
      selectedProject?.clientName && selectedProject?.client
        ? {
            id: selectedProject.client,
            name: selectedProject.clientName,
          }
        : undefined,
    status: formData.status || 'not_started',
    assignedMembers: formData.assignedMembers || [],
    assignedMembersData: enrichedMembers,
    workPeriod: {
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
    },
    notes: formData.notes || '',
    addToCalendar: formData.addToCalendar,
  };
}

/**
 * Build payload for task update with only changed fields
 * Returns null if nothing changed
 */
export function buildUpdatePayload({
  formData,
  originalTask,
  projects,
  members
}: BuildUpdatePayloadOptions): Partial<Task> | null {
  const updatePayload: Partial<Task> = {};

  // Check title
  if (formData.title !== originalTask.title) {
    updatePayload.title = formData.title;
  }

  // Check project
  if (formData.projectId !== originalTask.projectId) {
    updatePayload.projectId = formData.projectId;

    const newProject = projects.find(p => p.id === formData.projectId);
    if (newProject) {
      updatePayload.projectData = {
        id: newProject.id,
        name: newProject.name,
        status: newProject.status,
      };

      updatePayload.clientId = newProject.client || undefined;
      updatePayload.clientData =
        newProject.clientName && newProject.client
          ? {
              id: newProject.client,
              name: newProject.clientName,
            }
          : undefined;
    }
  }

  // Check status
  if (formData.status !== originalTask.status) {
    updatePayload.status = formData.status;
  }

  // Check dates
  if (formData.startDate && formData.endDate) {
    const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
    const startDateTime = new Date(formData.startDate);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
    const endDateTime = new Date(formData.endDate);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    const originalStart = originalTask.workPeriod?.startDate
      ? new Date(originalTask.workPeriod.startDate)
      : null;
    const originalEnd = originalTask.workPeriod?.endDate
      ? new Date(originalTask.workPeriod.endDate)
      : null;

    const datesChanged =
      !originalStart ||
      !originalEnd ||
      originalStart.getTime() !== startDateTime.getTime() ||
      originalEnd.getTime() !== endDateTime.getTime();

    if (datesChanged) {
      updatePayload.workPeriod = {
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
      };
    }
  }

  // Check assigned members
  const membersChanged =
    JSON.stringify(formData.assignedMembers?.sort()) !==
    JSON.stringify(originalTask.assignedMembers?.sort());

  if (membersChanged) {
    updatePayload.assignedMembers = formData.assignedMembers;

    updatePayload.assignedMembersData = formData.assignedMembers
      ?.map(memberId => {
        const member = members.find(m => m.id === memberId);
        return member
          ? {
              id: member.id,
              name: member.name,
              email: member.email,
              teams: member.teams,
            }
          : null;
      })
      .filter(Boolean) as Array<{
        id: string;
        name: string;
        email: string;
        teams?: string[];
      }>;
  }

  // Check notes
  if (formData.notes !== originalTask.notes) {
    updatePayload.notes = formData.notes;
  }

  // Always include addToCalendar
  updatePayload.addToCalendar = formData.addToCalendar;

  // Return null if nothing changed
  return Object.keys(updatePayload).length === 0 ? null : updatePayload;
}

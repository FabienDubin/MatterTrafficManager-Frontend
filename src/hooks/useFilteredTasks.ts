import { useMemo } from 'react';
import { useFilterStore } from '@/store/filter.store';
import { Task } from '@/types/task.types';

/**
 * Hook to filter tasks based on active filters (teams, members, clients, projects)
 *
 * @param tasks - All tasks to filter
 * @returns Filtered tasks based on current filter state
 */
export function useFilteredTasks(tasks: Task[]): Task[] {
  const { selectedTeams, selectedMembers, selectedClients, selectedProjects } = useFilterStore();

  return useMemo(() => {
    let filtered = tasks;

    // Filter by teams
    if (selectedTeams.length > 0) {
      filtered = filtered.filter(task => {
        // Check if task has team data and if any of the task's teams is in selectedTeams
        const hasTeamsData = task.teamsData && Array.isArray(task.teamsData);
        const hasInvolvedTeams = task.involvedTeamsData && Array.isArray(task.involvedTeamsData);

        const matchesTeamsData = hasTeamsData && task.teamsData!.some(team => selectedTeams.includes(team.id));
        const matchesInvolvedTeams = hasInvolvedTeams && task.involvedTeamsData!.some(team => selectedTeams.includes(team.id));

        return matchesTeamsData || matchesInvolvedTeams;
      });
    }

    // Filter by members
    if (selectedMembers.length > 0) {
      filtered = filtered.filter(task => {
        // Check if task has assigned members and if any of them is in selectedMembers
        if (task.assignedMembersData && Array.isArray(task.assignedMembersData)) {
          return task.assignedMembersData.some(member => selectedMembers.includes(member.id));
        }
        return false; // Don't show tasks without member data when filtering by member
      });
    }

    // Filter by clients
    if (selectedClients.length > 0) {
      filtered = filtered.filter(task => {
        // Check if task has client and if it's in selectedClients
        if (task.clientId) {
          return selectedClients.includes(task.clientId);
        }
        // Fallback to clientData if clientId is not present
        if (task.clientData && task.clientData.id) {
          return selectedClients.includes(task.clientData.id);
        }
        return false; // Don't show tasks without client data when filtering by client
      });
    }

    // Filter by projects
    if (selectedProjects.length > 0) {
      filtered = filtered.filter(task => {
        // Check if task has project and if it's in selectedProjects
        if (task.projectId) {
          return selectedProjects.includes(task.projectId);
        }
        // Fallback to projectData if projectId is not present
        if (task.projectData && task.projectData.id) {
          return selectedProjects.includes(task.projectData.id);
        }
        return false; // Don't show tasks without project data when filtering by project
      });
    }

    return filtered;
  }, [tasks, selectedTeams, selectedMembers, selectedClients, selectedProjects]);
}

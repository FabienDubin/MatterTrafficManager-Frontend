import { useMemo } from 'react';
import { useFilterStore } from '@/store/filter.store';
import { Task } from '@/types/task.types';

/**
 * Hook to filter tasks based on active filters (teams, members, etc.)
 *
 * @param tasks - All tasks to filter
 * @returns Filtered tasks based on current filter state
 */
export function useFilteredTasks(tasks: Task[]): Task[] {
  const { selectedTeams, selectedMembers } = useFilterStore();

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

    return filtered;
  }, [tasks, selectedTeams, selectedMembers]);
}

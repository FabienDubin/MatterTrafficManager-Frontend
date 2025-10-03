import { useState, useEffect } from 'react';
import { membersService, Member } from '@/services/api/members.service';
import { projectsService, Project } from '@/services/api/projects.service';
import { toast } from 'sonner';

export interface UseTaskFormDataReturn {
  projects: Project[];
  members: Member[];
  loadingProjects: boolean;
  loadingMembers: boolean;
  error: Error | null;
}

/**
 * Hook to load form data (projects and members) for task forms
 */
export function useTaskFormData(enabled: boolean): UseTaskFormDataReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const loadData = async () => {
      try {
        setLoadingProjects(true);
        const projectsData = await projectsService.getActiveProjects();
        setProjects(projectsData);
      } catch (err) {
        console.error('Failed to load projects:', err);
        setError(err as Error);
        toast.error('Erreur lors du chargement des projets');
      } finally {
        setLoadingProjects(false);
      }

      try {
        setLoadingMembers(true);
        const membersData = await membersService.getAllMembers();
        setMembers(membersData);
      } catch (err) {
        console.error('Failed to load members:', err);
        setError(err as Error);
        toast.error('Erreur lors du chargement des membres');
      } finally {
        setLoadingMembers(false);
      }
    };

    loadData();
  }, [enabled]);

  return {
    projects,
    members,
    loadingProjects,
    loadingMembers,
    error
  };
}

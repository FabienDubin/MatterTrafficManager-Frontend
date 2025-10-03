import { X } from 'lucide-react';
import { useFilterStore } from '@/store/filter.store';
import { useDisplayedTeams } from '@/store/config.store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { membersService, Member } from '@/services/api/members.service';
import { clientsService } from '@/services/api/clients.service';
import { projectsService, type Project } from '@/services/api/projects.service';

interface Client {
  id: string;
  name: string;
}

/**
 * ActiveFiltersIndicator - Display active filters as badges
 * Shows selected teams, members, clients, and projects with ability to remove individual filters
 */
export function ActiveFiltersIndicator() {
  const {
    selectedTeams,
    setSelectedTeams,
    selectedMembers,
    setSelectedMembers,
    selectedClients,
    setSelectedClients,
    selectedProjects,
    setSelectedProjects,
    resetFilters,
  } = useFilterStore();

  const { displayedTeams } = useDisplayedTeams();
  const [members, setMembers] = useState<Member[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Load data for displaying names
  useEffect(() => {
    const loadData = async () => {
      try {
        const [membersData, clientsResponse, projectsData] = await Promise.all([
          membersService.getAllMembers(),
          clientsService.getAllClients(),
          projectsService.getActiveProjects(),
        ]);
        setMembers(membersData);
        setClients(clientsResponse.data);
        setProjects(projectsData);
      } catch (error) {
        console.error('[ActiveFiltersIndicator] Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  const removeTeam = (teamId: string) => {
    setSelectedTeams(selectedTeams.filter(id => id !== teamId));
  };

  const removeMember = (memberId: string) => {
    setSelectedMembers(selectedMembers.filter(id => id !== memberId));
  };

  const removeClient = (clientId: string) => {
    setSelectedClients(selectedClients.filter(id => id !== clientId));
  };

  const removeProject = (projectId: string) => {
    setSelectedProjects(selectedProjects.filter(id => id !== projectId));
  };

  const hasActiveFilters =
    selectedTeams.length > 0 ||
    selectedMembers.length > 0 ||
    selectedClients.length > 0 ||
    selectedProjects.length > 0;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground font-medium">Filtres actifs :</span>

      {/* Team badges */}
      {selectedTeams.map(teamId => {
        const team = displayedTeams.find(t => t.id === teamId);
        if (!team) return null;
        return (
          <Badge key={teamId} variant="secondary" className="gap-1">
            {team.name}
            <X
              className="h-3 w-3 cursor-pointer hover:text-destructive"
              onClick={() => removeTeam(teamId)}
            />
          </Badge>
        );
      })}

      {/* Member badges */}
      {selectedMembers.map(memberId => {
        const member = members.find(m => m.id === memberId);
        if (!member) return null;
        return (
          <Badge key={memberId} variant="secondary" className="gap-1">
            {member.name}
            <X
              className="h-3 w-3 cursor-pointer hover:text-destructive"
              onClick={() => removeMember(memberId)}
            />
          </Badge>
        );
      })}

      {/* Client badges */}
      {selectedClients.map(clientId => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return null;
        return (
          <Badge key={clientId} variant="secondary" className="gap-1">
            {client.name}
            <X
              className="h-3 w-3 cursor-pointer hover:text-destructive"
              onClick={() => removeClient(clientId)}
            />
          </Badge>
        );
      })}

      {/* Project badges */}
      {selectedProjects.map(projectId => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return null;
        return (
          <Badge key={projectId} variant="secondary" className="gap-1">
            {project.name}
            <X
              className="h-3 w-3 cursor-pointer hover:text-destructive"
              onClick={() => removeProject(projectId)}
            />
          </Badge>
        );
      })}

      {/* Clear all button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={resetFilters}
        className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
      >
        Tout effacer
      </Button>
    </div>
  );
}

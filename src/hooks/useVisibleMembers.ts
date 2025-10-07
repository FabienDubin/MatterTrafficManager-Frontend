import { useMemo } from 'react';
import { useFilterStore } from '@/store/filter.store';
import { Member } from '@/types/calendar.types';

/**
 * Hook pour filtrer et trier les membres visibles dans la DayView
 * selon les filtres actifs (équipes, membres)
 *
 * @param members - Membres extraits des tâches filtrées
 * @param allMembers - Tous les membres depuis l'API
 * @returns Liste des membres visibles triés alphabétiquement
 */
export function useVisibleMembers(members: Member[], allMembers: Member[]): Member[] {
  const { selectedTeams, selectedMembers } = useFilterStore();

  return useMemo(() => {
    let result: Member[] = [];

    // Si aucun filtre actif, montrer tous les membres qui ont des tâches
    if (selectedTeams.length === 0 && selectedMembers.length === 0) {
      result = members;
    }
    // Si des membres spécifiques sont sélectionnés, ne montrer que ceux-là (depuis allMembers)
    else if (selectedMembers.length > 0) {
      result = allMembers
        .filter(member => selectedMembers.includes(member.id))
        .map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
          teams: member.teams || [],
        }));
    }
    // Si des équipes sont sélectionnées, montrer les membres de ces équipes (depuis allMembers)
    else if (selectedTeams.length > 0) {
      // Compare team IDs directly - member.teams contains team IDs, not names
      result = allMembers
        .filter(member => {
          if (!member.teams || !Array.isArray(member.teams)) return false;
          // member.teams contains team IDs, selectedTeams contains team IDs
          return member.teams.some(teamId => selectedTeams.includes(teamId));
        })
        .map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
          teams: member.teams || [],
        }));
    }

    // Trier par ordre alphabétique (insensible à la casse)
    return result.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  }, [members, allMembers, selectedTeams, selectedMembers]);
}

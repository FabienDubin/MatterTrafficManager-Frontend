import { useMemo } from 'react';
import { differenceInMinutes, isValid, parseISO } from 'date-fns';
import { Task } from '@/types/task.types';

// Interface pour les données d'occupation d'un membre
export interface OccupationData {
  occupationHours: number;
  occupationPercentage: number;
  hasSpecialStatus: boolean;
  specialStatusType?: 'holiday' | 'school' | 'remote';
  specialStatusEmoji?: string;
  excludeFromTeamCalculation?: boolean; // holiday/school excluent du calcul équipe
}

// Interface pour les données d'occupation par équipe
export interface TeamOccupationData {
  teamId: string;
  teamName: string;
  globalPercentage: number;
  members: Array<{
    id: string;
    name: string;
    data: OccupationData;
  }>;
}

/**
 * Hook pour calculer les taux d'occupation des membres pour une journée donnée
 *
 * @param date - Date à analyser
 * @param tasks - Liste des tâches (déjà filtrées pour la journée)
 * @param dailyWorkingHours - Nombre d'heures de travail quotidiennes (défaut: 8)
 * @returns Map avec les données d'occupation par membre
 */
export function useOccupationRates(date: Date, tasks: Task[], dailyWorkingHours: number = 8) {
  return useMemo(() => {
    const occupationByMember = new Map<string, OccupationData>();

    // Fonction utilitaire pour calculer la durée d'une tâche en heures
    const calculateTaskDuration = (task: Task): number => {
      // Si c'est une tâche journée entière, retourner les heures quotidiennes
      if (task.isAllDay) {
        return dailyWorkingHours;
      }

      // Si pas de workPeriod, considérer comme 0
      if (!task.workPeriod?.startDate || !task.workPeriod?.endDate) {
        return 0;
      }

      try {
        const startDate =
          typeof task.workPeriod.startDate === 'string'
            ? parseISO(task.workPeriod.startDate)
            : task.workPeriod.startDate;
        const endDate =
          typeof task.workPeriod.endDate === 'string'
            ? parseISO(task.workPeriod.endDate)
            : task.workPeriod.endDate;

        if (!isValid(startDate) || !isValid(endDate)) {
          return 0;
        }

        // Calculer la différence en minutes puis convertir en heures
        const durationMinutes = differenceInMinutes(endDate, startDate);
        return Math.max(0, durationMinutes / 60);
      } catch (error) {
        console.warn('Error calculating task duration:', error);
        return 0;
      }
    };

    // Fonction pour obtenir l'emoji correspondant au type de tâche
    const getStatusEmoji = (taskType: string): string => {
      switch (taskType) {
        case 'holiday':
          return '🏖️';
        case 'school':
          return '📚';
        case 'remote':
          return '🏠';
        default:
          return '';
      }
    };

    // Étape 1: Identifier d'abord les membres avec des statuts spéciaux (holiday/school/remote)
    const membersWithSpecialStatus = new Map<
      string,
      { taskType: string; emoji: string; excludeFromTeam: boolean }
    >();

    const specialTasks = tasks.filter(task =>
      ['holiday', 'school', 'remote'].includes(task.taskType || '')
    );

    specialTasks.forEach(task => {
      if (!task.assignedMembersData || task.assignedMembersData.length === 0) {
        return;
      }

      task.assignedMembersData.forEach(member => {
        const taskType = task.taskType || '';
        membersWithSpecialStatus.set(member.id, {
          taskType,
          emoji: getStatusEmoji(taskType),
          excludeFromTeam: taskType === 'holiday' || taskType === 'school',
        });
      });
    });

    // Étape 2: Pour chaque membre impliqué dans les tâches, initialiser ses données
    const allMembers = new Set<string>();
    tasks.forEach(task => {
      task.assignedMembersData?.forEach(member => {
        allMembers.add(member.id);
      });
    });

    allMembers.forEach(memberId => {
      const specialStatus = membersWithSpecialStatus.get(memberId);

      occupationByMember.set(memberId, {
        occupationHours: 0,
        occupationPercentage: 0,
        hasSpecialStatus: !!specialStatus,
        specialStatusType: specialStatus?.taskType as 'holiday' | 'school' | 'remote' | undefined,
        specialStatusEmoji: specialStatus?.emoji,
        excludeFromTeamCalculation: specialStatus?.excludeFromTeam || false,
      });
    });

    // Étape 3: Calculer les heures d'occupation SEULEMENT pour les membres non-holiday/non-school
    // Les membres holiday/school restent à 0 heures
    // Les membres remote sont traités normalement (leurs autres tâches comptent)
    const workingTasks = tasks.filter(
      task => !['holiday', 'remote', 'school'].includes(task.taskType || 'task')
    );

    workingTasks.forEach(task => {
      if (!task.assignedMembersData || task.assignedMembersData.length === 0) {
        return;
      }

      const duration = calculateTaskDuration(task);
      if (duration <= 0) return;

      task.assignedMembersData.forEach(member => {
        const specialStatus = membersWithSpecialStatus.get(member.id);

        // Si le membre est en holiday ou school, il ne compte AUCUNE heure (même les autres tâches)
        if (
          specialStatus &&
          (specialStatus.taskType === 'holiday' || specialStatus.taskType === 'school')
        ) {
          return; // Skip - membre indisponible
        }

        // Si le membre est en remote ou normal, on compte ses heures normalement
        const existing = occupationByMember.get(member.id)!;
        existing.occupationHours += duration;
        occupationByMember.set(member.id, existing);
      });
    });

    // Étape 4: Calculer les pourcentages d'occupation
    occupationByMember.forEach(data => {
      data.occupationPercentage = (data.occupationHours / dailyWorkingHours) * 100;
      // Note: Le pourcentage peut dépasser 100% en cas de surcharge
      // Exemple: isAllDay (8h) + tâche 2h = 10h / 8h = 125%
    });

    return occupationByMember;
  }, [date, tasks, dailyWorkingHours]);
}

/**
 * Hook pour calculer les données d'occupation par équipe
 *
 * @param occupationData - Données d'occupation par membre (depuis useOccupationRates)
 * @param members - Liste de tous les membres avec leurs équipes
 * @param teams - Liste des équipes configurées
 * @returns Array des données d'occupation par équipe
 */
export function useTeamOccupationData(
  occupationData: Map<string, OccupationData>,
  members: Array<{ id: string; name: string; teams?: string[] | Array<{ id: string; name: string }> }>,
  teams: Array<{ id: string; name: string }>
): TeamOccupationData[] {
  return useMemo(() => {
    const teamData: TeamOccupationData[] = [];

    teams.forEach(team => {
      // Filtrer les membres de cette équipe - gérer les deux formats de teams
      const teamMembers = members.filter(member => {
        if (!member.teams) return false;
        
        // Si teams est un array de strings (noms ou IDs)
        if (typeof member.teams[0] === 'string') {
          return (member.teams as string[]).includes(team.id) || (member.teams as string[]).includes(team.name);
        }
        
        // Si teams est un array d'objets {id, name}
        return member.teams.some(t => typeof t === 'object' && (t.id === team.id || t.name === team.name));
      });

      // Calculer les données pour chaque membre de l'équipe
      const membersWithData = teamMembers.map(member => {
        const memberOccupation = occupationData.get(member.id) || {
          occupationHours: 0,
          occupationPercentage: 0,
          hasSpecialStatus: false,
          excludeFromTeamCalculation: false,
        };

        return {
          id: member.id,
          name: member.name,
          data: memberOccupation,
        };
      });

      // Calculer le pourcentage global de l'équipe
      // Exclure les membres holiday/school, inclure les membres remote
      const activeMembers = membersWithData.filter(m => !m.data.excludeFromTeamCalculation);

      const globalPercentage =
        activeMembers.length > 0
          ? activeMembers.reduce((sum, member) => sum + member.data.occupationPercentage, 0) /
            activeMembers.length
          : 0;

      // Trier les membres par ordre alphabétique
      membersWithData.sort((a, b) => a.name.localeCompare(b.name));

      teamData.push({
        teamId: team.id,
        teamName: team.name,
        globalPercentage,
        members: membersWithData,
      });
    });

    return teamData;
  }, [occupationData, members, teams]);
}

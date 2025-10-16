import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useOccupationRates, useTeamOccupationData } from '@/hooks/useOccupationRates';
import { useCalendarConfigStore } from '@/store/calendar-config.store';
import { useFilterStore } from '@/store/filter.store';
import { Task } from '@/types/task.types';
import { Member } from '@/types/calendar.types';

interface Team {
  id: string;
  name: string;
  icon?: string;
}

interface AvailabilityCardProps {
  date: Date;
  tasks: Task[];
  allMembers: Member[];
  teams: Team[];
  className?: string;
}

/**
 * AvailabilityCard - Affichage de la disponibilité des membres par équipe pour une journée
 *
 * Features:
 * - 3 accordéons par équipe avec taux d'occupation global
 * - Liste des membres avec leur pourcentage individuel
 * - Progress bars colorées (primary < 100%, destructive ≥ 100%)
 * - Gestion des statuts spéciaux (holiday/school avec badges)
 * - Navigation vers DayView au clic sur membre
 * - Respect des filtres équipes/membres actifs
 */
export function AvailabilityCard({
  date,
  tasks,
  allMembers,
  teams,
  className,
}: AvailabilityCardProps) {
  const navigate = useNavigate();
  const { config } = useCalendarConfigStore();
  const { selectedTeams, selectedMembers } = useFilterStore();

  const dailyWorkingHours = config?.dailyWorkingHours || 8;

  // Filtrer les tâches pour cette journée spécifique (inclure les tâches qui chevauchent)
  const dayTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!task.workPeriod?.startDate) return false;

      const taskStart = new Date(task.workPeriod.startDate);
      const taskEnd = task.workPeriod.endDate ? new Date(task.workPeriod.endDate) : taskStart;

      // Pour les tâches shouldSplitDaily (school, holiday), vérifier si la date est dans la plage
      if (task.shouldSplitDaily && task.isAllDay) {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        return taskStart <= dayEnd && taskEnd > dayStart;
      }

      // Pour les tâches normales, vérifier si elles commencent ce jour
      return (
        taskStart.getFullYear() === date.getFullYear() &&
        taskStart.getMonth() === date.getMonth() &&
        taskStart.getDate() === date.getDate()
      );
    });
  }, [tasks, date]);

  // Calculer les taux d'occupation
  const occupationData = useOccupationRates(date, dayTasks, dailyWorkingHours);

  // Préparer les données par équipe avec filtrage
  const teamOccupationData = useTeamOccupationData(occupationData, allMembers, teams);

  // Appliquer les filtres équipes/membres
  const filteredTeamData = useMemo(() => {
    let filtered = teamOccupationData;

    // Filtrer par équipes sélectionnées
    if (selectedTeams.length > 0) {
      filtered = filtered.filter(team => selectedTeams.includes(team.teamId));
    }

    // Filtrer par membres sélectionnés
    if (selectedMembers.length > 0) {
      filtered = filtered
        .map(team => ({
          ...team,
          members: team.members.filter(member => selectedMembers.includes(member.id)),
        }))
        .filter(team => team.members.length > 0);
    }

    return filtered;
  }, [teamOccupationData, selectedTeams, selectedMembers]);

  // Navigation vers DayView avec membre sélectionné
  const handleMemberClick = (memberId: string) => {
    const dateParam = format(date, 'yyyy-MM-dd');
    navigate(`/calendar/day?date=${dateParam}&member=${memberId}`);
  };

  return (
    <Card className={`w-full h-fit ${className}`}>
      <CardContent className='pt-0'>
        {filteredTeamData.length === 0 ? (
          <div className='text-center text-sm text-muted-foreground py-4'>
            Aucune équipe ou membre trouvé
          </div>
        ) : (
          <Accordion 
            type='multiple' 
            defaultValue={filteredTeamData.length > 0 ? [filteredTeamData[0].teamId] : []} 
            className='w-full space-y-1'
          >
            {filteredTeamData.map(team => (
              <AccordionItem key={team.teamId} value={team.teamId} className=''>
                <AccordionTrigger className='py-2 hover:no-underline'>
                  <div className='flex items-center justify-between w-full'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-medium'>{team.teamName}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs text-muted-foreground'>
                        {Math.round(team.globalPercentage)}%
                      </span>
                      <Progress
                        value={Math.min(team.globalPercentage, 100)}
                        className={`w-16 h-2 ${team.globalPercentage > 100 ? '[&>div]:bg-destructive' : ''}`}
                      />
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className='pb-3'>
                  <div className='space-y-1'>
                    {team.members.map(member => (
                      <div
                        key={member.id}
                        className='grid grid-cols-[auto_1fr_auto_auto] gap-1 items-center py-1 hover:bg-muted/50 rounded cursor-pointer'
                        onClick={() => handleMemberClick(member.id)}
                      >
                        {/* Badge statut spécial */}
                        <div className='w-5 flex justify-center'>
                          {member.data.hasSpecialStatus && (
                            <Badge
                              variant='secondary'
                              className='text-xs h-4 w-4 p-0 flex items-center justify-center'
                            >
                              {member.data.specialStatusEmoji}
                            </Badge>
                          )}
                        </div>

                        {/* Nom membre (tronqué si nécessaire) */}
                        <span className='text-xs truncate'>{member.name}</span>

                        {/* Pourcentage occupation */}
                        {!member.data.hasSpecialStatus ||
                        (member.data.specialStatusType !== 'holiday' &&
                          member.data.specialStatusType !== 'school') ? (
                          <>
                            <span className='text-xs text-muted-foreground text-right min-w-[2rem]'>
                              {Math.round(member.data.occupationPercentage)}%
                            </span>
                            <Progress
                              value={Math.min(member.data.occupationPercentage, 100)}
                              className={`w-10 h-1.5 ${member.data.occupationPercentage > 100 ? '[&>div]:bg-destructive' : ''}`}
                            />
                          </>
                        ) : (
                          <>
                            <span className='text-xs text-muted-foreground'>—</span>
                            <div className='w-10'></div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

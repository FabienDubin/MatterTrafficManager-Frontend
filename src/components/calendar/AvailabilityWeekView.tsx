import { useMemo } from 'react';
import { startOfWeek, addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AvailabilityCard } from './AvailabilityCard';
import { CalendarHeaderBadges } from './CalendarHeaderBadges';
import { getSpecialTasksForDate } from '@/utils/calendarBadges';
import { tasksToCalendarEvents } from '@/utils/taskMapper';
import { Task } from '@/types/task.types';
import { Member } from '@/types/calendar.types';

interface Team {
  id: string;
  name: string;
  icon?: string;
}

interface AvailabilityWeekViewProps {
  currentDate: Date;
  tasks: Task[];
  allMembers: Member[];
  teams: Team[];
  showWeekends: boolean;
  onNavLinkDayClick?: (date: Date) => void;
}

/**
 * AvailabilityWeekView - Vue semaine dédiée pour l'affichage de disponibilité
 *
 * Features:
 * - Grid CSS pure 7 colonnes (ou 5 sans weekends)
 * - Headers identiques à FullCalendar avec badges
 * - AvailabilityCard pleine largeur par jour
 * - Responsive avec scroll horizontal mobile
 * - Réutilise les utilitaires existants (format dates, badges)
 */
export function AvailabilityWeekView({
  currentDate,
  tasks,
  allMembers,
  teams,
  showWeekends = true,
  onNavLinkDayClick,
}: AvailabilityWeekViewProps) {
  // Calculer les jours de la semaine (lundi à dimanche)
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Commencer lundi
    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(start, i);
      days.push(day);
    }

    // Filtrer les weekends si nécessaire
    if (!showWeekends) {
      return days.filter((_, index) => index < 5); // Lundi à vendredi seulement
    }

    return days;
  }, [currentDate, showWeekends]);

  // Convertir les tâches en events pour réutiliser les utilitaires badges
  const events = useMemo(() => {
    return tasksToCalendarEvents(tasks);
  }, [tasks]);

  // Nombre de colonnes pour la grille
  const gridCols = showWeekends ? 'grid-cols-7' : 'grid-cols-5';

  return (
    <div className='availability-week-view h-full flex flex-col border rounded-md'>
      {/* Header row avec dates et badges */}
      <div className={`grid ${gridCols} border-b bg-muted/30`}>
        {weekDays.map(date => {
          const badges = getSpecialTasksForDate(events, date);
          const dateText = format(date, 'EEE dd/MM', { locale: fr });

          return (
            <div
              key={date.toISOString()}
              className='fc-col-header-cell px-2 py-2 text-center border-r last:border-r-0 min-h-[3rem] flex flex-col justify-center'
            >
              {/* Date principale - cliquable */}
              <div 
                className='text-l font-semibold text-foreground cursor-pointer hover:text-primary hover:underline'
                onClick={() => onNavLinkDayClick?.(date)}
              >
                {dateText}
              </div>

              {/* Badges des tâches spéciales */}
              {badges.length > 0 && (
                <div className='mt-1 flex justify-center'>
                  <CalendarHeaderBadges badges={badges} maxVisible={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Content row avec AvailabilityCards */}
      <div className={`grid ${gridCols} flex-1 overflow-hidden`}>
        {weekDays.map(date => (
          <div key={date.toISOString()} className='border-r last:border-r-0 h-full overflow-y-auto'>
            <AvailabilityCard
              date={date}
              tasks={tasks}
              allMembers={allMembers}
              teams={teams}
              className='h-fit min-h-full p-2'
            />
          </div>
        ))}
      </div>
    </div>
  );
}

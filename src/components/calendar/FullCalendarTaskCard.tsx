import React from 'react';
import { EventContentArg } from '@fullcalendar/core';
import { Task } from '@/types/task.types';
import { ViewConfig } from '@/types/calendar.types';
import { TaskCard } from './TaskCard';
import { useCalendarConfigStore } from '@/store/calendar-config.store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FullCalendarTaskCardProps {
  eventInfo: EventContentArg;
  viewConfig?: ViewConfig;
}

/**
 * Wrapper pour utiliser TaskCard dans FullCalendar
 */
export function FullCalendarTaskCard({ eventInfo, viewConfig: passedViewConfig }: FullCalendarTaskCardProps) {
  const task = eventInfo.event.extendedProps.task as Task | undefined;
  const { config } = useCalendarConfigStore();
  
  if (!task) {
    return <div className="text-xs truncate px-1">{eventInfo.event.title}</div>;
  }

  const isMonthView = eventInfo.view.type === 'dayGridMonth';
  const isWeekView = eventInfo.view.type === 'timeGridWeek';
  const isDayView = eventInfo.view.type === 'timeGridDay';
  const isAllDay = eventInfo.event.allDay;
  
  // Utiliser la config spécifique à la vue depuis le store
  const viewConfig = passedViewConfig || (
    isMonthView ? config?.monthView :
    isWeekView ? config?.weekView :
    isDayView ? config?.dayView :
    undefined
  );
  
  // Pour les tâches journée entière spéciales (congé/TT/école) dans la vue semaine/mois
  // On affiche juste un badge compact
  const isSpecialAllDay = isAllDay && ['holiday', 'remote', 'school'].includes(task.taskType || '');
  
  if (isSpecialAllDay && (isWeekView || isMonthView)) {
    const getBadgeContent = () => {
      switch (task.taskType) {
        case 'holiday':
          return { emoji: '🏖️', label: 'Congé', bgColor: 'bg-gray-200 dark:bg-gray-700' };
        case 'remote':
          return { emoji: '🏠', label: 'Télétravail', bgColor: 'bg-blue-100 dark:bg-blue-900' };
        case 'school':
          return { emoji: '📚', label: 'École/Formation', bgColor: 'bg-indigo-100 dark:bg-indigo-900' };
        default:
          return null;
      }
    };
    
    const badgeContent = getBadgeContent();
    if (!badgeContent) {
      return null;
    }
    
    // Récupérer le nom du membre assigné
    const memberName = task.assignedMembersData?.[0]?.name || 
                      task.assignedMembers?.[0] || 
                      'Non assigné';
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${badgeContent.bgColor}`}>
              <span>{badgeContent.emoji}</span>
              <span className="truncate">{memberName}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-normal">
            <p className="font-semibold">{memberName}</p>
            <p className="text-xs text-muted-foreground">{badgeContent.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Adapter le rendu selon la vue
  const compact = isMonthView;
  // Pas d'horaires dans les vues semaine/mois car déjà visibles dans la grille
  const showTime = false;

  return (
    <div className="flex w-full h-full">
      <TaskCard
        task={task}
        viewConfig={viewConfig}
        showTime={showTime}
        compact={compact}
        className={`flex-1 h-full ${isMonthView ? 'text-[11px]' : 'text-xs'}`}
        style={{
          padding: isMonthView ? '1px 4px' : '2px 6px'
        }}
      />
    </div>
  );
}
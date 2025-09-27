import React from 'react';
import { EventContentArg } from '@fullcalendar/core';
import { Task } from '@/types/task.types';
import { ViewConfig } from '@/types/calendar.types';
import { TaskCard } from './TaskCard';
import { useCalendarConfigStore } from '@/store/calendar-config.store';

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
  
  // Utiliser la config spécifique à la vue depuis le store
  const viewConfig = passedViewConfig || (
    isMonthView ? config?.monthView :
    isWeekView ? config?.weekView :
    isDayView ? config?.dayView :
    undefined
  );
  
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
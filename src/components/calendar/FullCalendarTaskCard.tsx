import React from 'react';
import { EventContentArg } from '@fullcalendar/core';
import { Task } from '@/types/task.types';
import { ViewConfig } from '@/types/calendar.types';
import { TaskCard } from './TaskCard';

interface FullCalendarTaskCardProps {
  eventInfo: EventContentArg;
  viewConfig?: ViewConfig;
}

/**
 * Wrapper pour utiliser TaskCard dans FullCalendar
 */
export function FullCalendarTaskCard({ eventInfo, viewConfig }: FullCalendarTaskCardProps) {
  const task = eventInfo.event.extendedProps.task as Task | undefined;
  
  if (!task) {
    return <div className="text-xs truncate px-1">{eventInfo.event.title}</div>;
  }

  const isMonthView = eventInfo.view.type === 'dayGridMonth';
  const isWeekView = eventInfo.view.type === 'timeGridWeek';
  
  // Calculer la hauteur disponible (estimation basée sur la vue)
  const eventHeight = isMonthView ? 20 : 40;
  
  // Adapter le rendu selon la vue et l'espace disponible
  const compact = isMonthView || eventHeight < 40;
  const showTime = !eventInfo.event.allDay && !isMonthView && eventHeight > 30;

  return (
    <div className="w-full h-full">
      <TaskCard
        task={task}
        viewConfig={viewConfig}
        showTime={showTime}
        compact={compact}
        className={`h-full border-0 ${isWeekView ? 'text-[11px]' : isMonthView ? 'text-[10px]' : 'text-xs'}`}
        style={{
          padding: compact ? '2px 4px' : '4px 6px'
        }}
      />
    </div>
  );
}
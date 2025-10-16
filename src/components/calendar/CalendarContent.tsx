import { RefObject, useEffect, useRef } from 'react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { AvailabilityWeekView } from '@/components/calendar/AvailabilityWeekView';
import { DayView } from '@/components/calendar/DayView';
import { CalendarViewType } from '@/components/calendar/ViewSwitcher';
import { Calendar } from 'lucide-react';
import { EventInput } from '@fullcalendar/core';
import { Task } from '@/types/task.types';
import { Member } from '@/types/calendar.types';
import FullCalendar from '@fullcalendar/react';

interface CalendarContentProps {
  // Loading states
  isInitialLoad: boolean;
  tasks: Task[];
  error: Error | string | null;

  // Calendar config
  currentView: CalendarViewType;
  currentDate: Date;
  calendarRef: RefObject<FullCalendar | null>;
  showWeekends: boolean;
  viewConfig: any;

  // Calendar events
  events: EventInput[];
  members: Member[];

  // Availability mode (utilisé seulement pour la logique conditionnelle)
  showAvailability?: boolean;
  teams?: any[];

  // Event handlers - FullCalendar
  onDateClick: (arg: any) => void;
  onEventClick: (info: any) => void;
  onEventDrop: (info: any) => void;
  onEventResize: (info: any) => void;
  onSelect: (selectInfo: any) => void;
  onDatesChange: (start: Date, end: Date) => void;
  onNavLinkDayClick: (date: Date) => void;

  // Event handlers - DayView
  onTaskClick: (task: Task) => void;
  onTimeSlotClick: (member: Member | null, date: Date, hour: number) => void;
  onTimeSlotSelect: (member: Member | null, startDate: Date, endDate: Date) => void;
  onTaskDrop: (
    task: Task,
    newMemberId: string | null,
    newDate: Date,
    sourceMemberId?: string
  ) => void;
  onTaskResize: (task: Task, newStartDate: Date, newEndDate: Date) => void;
}

/**
 * CalendarContent - Affiche CalendarView ou DayView, wrappé avec CalendarLayout
 * C'est ici que le CalendarLayout est appliqué pour que la sidebar soit limitée à cette zone
 */
export function CalendarContent({
  isInitialLoad,
  tasks,
  error,
  currentView,
  currentDate,
  calendarRef,
  showWeekends,
  viewConfig,
  events,
  members,
  showAvailability = false,
  teams = [],
  onDateClick,
  onEventClick,
  onEventDrop,
  onEventResize,
  onSelect,
  onDatesChange,
  onNavLinkDayClick,
  onTaskClick,
  onTimeSlotClick,
  onTimeSlotSelect,
  onTaskDrop,
  onTaskResize,
}: CalendarContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Observe container size changes and update FullCalendar when needed
  useEffect(() => {
    if (!containerRef.current || currentView === 'day') return;

    const resizeObserver = new ResizeObserver(() => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.updateSize();
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [calendarRef, currentView]);

  // Loading state
  if (isInitialLoad && tasks.length === 0) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-muted-foreground'>Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-center'>
          <p className='text-destructive'>Erreur lors du chargement des tâches</p>
          <p className='text-sm text-muted-foreground mt-2'>
            Affichage des données de démonstration
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-center'>
          <Calendar className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
          <p className='text-lg font-medium'>Aucune tâche pour cette période</p>
          <p className='text-sm text-muted-foreground mt-2'>
            Les tâches apparaîtront ici une fois synchronisées avec Notion
          </p>
        </div>
      </div>
    );
  }

  // Render DayView
  if (currentView === 'day') {
    return (
      <div style={{ height: '85%' }}>
        <DayView
          date={currentDate}
          tasks={tasks}
          members={members}
          viewConfig={viewConfig}
          onTaskClick={onTaskClick}
          onTimeSlotClick={onTimeSlotClick}
          onTimeSlotSelect={onTimeSlotSelect}
          onTaskDrop={onTaskDrop}
          onTaskResize={onTaskResize}
        />
      </div>
    );
  }

  // Render AvailabilityWeekView if in availability mode
  if (showAvailability && currentView === 'week') {
    return (
      <div ref={containerRef} className='h-full overflow-hidden'>
        <AvailabilityWeekView
          currentDate={currentDate}
          tasks={tasks}
          allMembers={members}
          teams={teams}
          showWeekends={showWeekends}
          onNavLinkDayClick={onNavLinkDayClick}
        />
      </div>
    );
  }

  // Render CalendarView (week/month) - mode normal
  return (
    <div ref={containerRef} className='h-full'>
      <CalendarView
        ref={calendarRef}
        events={events}
        onDateClick={onDateClick}
        onEventClick={onEventClick}
        onEventDrop={onEventDrop}
        onEventResize={onEventResize}
        onSelect={onSelect}
        onDatesChange={onDatesChange}
        onNavLinkDayClick={onNavLinkDayClick}
        currentView={currentView === 'week' ? 'timeGridWeek' : 'dayGridMonth'}
        currentDate={currentDate}
        showWeekends={showWeekends}
        viewConfig={viewConfig}
      />
    </div>
  );
}

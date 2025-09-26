import { useEffect, useRef, forwardRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { EventInput } from '@fullcalendar/core';

interface CalendarViewProps {
  events?: EventInput[];
  onDateClick?: (info: any) => void;
  onEventClick?: (info: any) => void;
  onDatesChange?: (start: Date, end: Date) => void;
  currentView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
  showWeekends?: boolean;
}

export const CalendarView = forwardRef<FullCalendar, CalendarViewProps>(({ 
  events = [], 
  onDateClick, 
  onEventClick, 
  onDatesChange,
  currentView = 'timeGridWeek',
  showWeekends = true
}, ref) => {
  const internalRef = useRef<FullCalendar>(null);
  const calendarRef = ref || internalRef;

  // Apply theme-aware styling
  useEffect(() => {
    const applyThemeStyles = () => {
      const root = document.documentElement;
      const isDark = root.classList.contains('dark');
      
      // Update FullCalendar custom CSS variables
      const calendarEl = document.querySelector('.fc');
      if (calendarEl) {
        const style = calendarEl as HTMLElement;
        if (isDark) {
          style.style.setProperty('--fc-border-color', 'hsl(var(--border))');
          style.style.setProperty('--fc-button-bg-color', 'hsl(var(--primary))');
          style.style.setProperty('--fc-button-text-color', 'hsl(var(--primary-foreground))');
          style.style.setProperty('--fc-button-hover-bg-color', 'hsl(var(--primary) / 0.9)');
          style.style.setProperty('--fc-page-bg-color', 'hsl(var(--background))');
          style.style.setProperty('--fc-neutral-bg-color', 'hsl(var(--muted))');
          style.style.setProperty('--fc-neutral-text-color', 'hsl(var(--muted-foreground))');
          style.style.setProperty('--fc-today-bg-color', 'hsl(var(--accent))');
        } else {
          style.style.setProperty('--fc-border-color', 'hsl(var(--border))');
          style.style.setProperty('--fc-button-bg-color', 'hsl(var(--primary))');
          style.style.setProperty('--fc-button-text-color', 'hsl(var(--primary-foreground))');
          style.style.setProperty('--fc-button-hover-bg-color', 'hsl(var(--primary) / 0.9)');
          style.style.setProperty('--fc-page-bg-color', 'hsl(var(--background))');
          style.style.setProperty('--fc-neutral-bg-color', 'hsl(var(--muted))');
          style.style.setProperty('--fc-neutral-text-color', 'hsl(var(--muted-foreground))');
          style.style.setProperty('--fc-today-bg-color', 'hsl(var(--accent))');
        }
      }
    };

    applyThemeStyles();
    
    // Observer for theme changes
    const observer = new MutationObserver(() => {
      applyThemeStyles();
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="calendar-container h-full">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={currentView}
        locale={frLocale}
        headerToolbar={false}
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
          startTime: '08:00',
          endTime: '20:00'
        }}
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        slotDuration="00:30:00"
        height="auto"
        contentHeight="auto"
        aspectRatio={1.8}
        weekends={showWeekends}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        events={events}
        dateClick={onDateClick}
        eventClick={onEventClick}
        eventDisplay="block"
        // Callbacks pour détecter les changements de vue et de dates
        datesSet={(dateInfo) => {
          // Appelé quand les dates visibles changent (navigation ou changement de vue)
          if (onDatesChange) {
            onDatesChange(dateInfo.start, dateInfo.end);
          }
        }}
        // Options pour améliorer l'affichage
        weekNumbers={false}
        navLinks={true} // Permet de cliquer sur les jours/semaines pour naviguer
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          meridiem: false
        }}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          meridiem: false
        }}
      />
      <style>{`
        .fc {
          font-family: inherit;
          color: hsl(var(--foreground));
        }
        
        .fc-toolbar-title {
          color: hsl(var(--foreground));
        }
        
        /* Style headers like DayView */
        .fc-col-header {
          background: hsl(var(--muted) / 0.3);
          border-bottom: 1px solid hsl(var(--border));
        }
        
        .fc-col-header-cell {
          padding: 0.75rem 0;
          font-weight: 500;
        }
        
        .fc-col-header-cell-cushion {
          color: hsl(var(--foreground));
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }
        
        /* Style day headers in week view */
        .fc-timeGrid-view .fc-col-header-cell-cushion {
          font-size: 0.875rem;
        }
        
        /* Style day numbers in month view */
        .fc-daygrid-day-number {
          color: hsl(var(--foreground));
          padding: 0.5rem;
          font-weight: 500;
        }
        
        .fc-daygrid-day-top {
          display: flex;
          justify-content: flex-start;
        }
        
        /* Style time labels */
        .fc-timegrid-slot-label {
          vertical-align: middle;
        }
        
        .fc-timegrid-slot-label-cushion {
          color: hsl(var(--muted-foreground));
          font-size: 0.75rem;
          padding-right: 0.5rem;
        }
        
        /* Today highlight - subtle like DayView */
        .fc-day-today {
          background-color: hsl(var(--accent) / 0.1) !important;
        }
        
        .fc-day-today .fc-col-header-cell-cushion,
        .fc-day-today .fc-daygrid-day-number {
          color: hsl(var(--primary));
          font-weight: 600;
        }
        
        /* Grid lines - softer */
        .fc-theme-standard td,
        .fc-theme-standard th,
        .fc-theme-standard .fc-scrollgrid {
          border-color: hsl(var(--border) / 0.5);
        }
        
        .fc-theme-standard .fc-scrollgrid {
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        /* Remove extra borders */
        .fc-scrollgrid-sync-table {
          border: none;
        }
        
        .fc-view {
          border: none;
        }
        
        /* Time grid lines - make them more subtle */
        .fc-timegrid-slot {
          height: 3rem;
        }
        
        .fc-timegrid-slot-minor {
          border-top-style: dotted;
          border-color: hsl(var(--border) / 0.3);
        }
        
        /* Events styling */
        .fc-event {
          cursor: pointer;
          border: none;
          font-size: 0.8125rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
        }
        
        .fc-event:hover {
          filter: brightness(0.9);
        }
        
        .fc-event-main {
          padding: 0.125rem 0.25rem;
        }
        
        /* Week view specific - align with DayView */
        .fc-timegrid-axis {
          width: 4rem;
        }
        
        .fc-timegrid-axis-cushion {
          color: hsl(var(--muted-foreground));
          font-size: 0.75rem;
        }
        
        /* Month view specific */
        .fc-daygrid-day {
          min-height: 5rem;
        }
        
        .fc-daygrid-day-frame {
          min-height: 100%;
        }
        
        .fc-daygrid-day-events {
          margin-top: 0.25rem;
        }
        
        /* Weekend styling */
        .fc-day-sat,
        .fc-day-sun {
          background: hsl(var(--muted) / 0.2);
        }
        
        /* Scrollbar styling */
        .fc-scroller::-webkit-scrollbar {
          width: 0.5rem;
          height: 0.5rem;
        }
        
        .fc-scroller::-webkit-scrollbar-track {
          background: hsl(var(--muted) / 0.3);
          border-radius: 0.25rem;
        }
        
        .fc-scroller::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 0.25rem;
        }
        
        .fc-scroller::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
        
        /* Dark mode specific text fixes */
        .dark .fc-col-header-cell-cushion,
        .dark .fc-daygrid-day-number,
        .dark .fc-timegrid-slot-label-cushion,
        .dark .fc-toolbar-title {
          color: hsl(var(--foreground));
        }
        
        .dark .fc-timegrid-axis-cushion {
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  );
});
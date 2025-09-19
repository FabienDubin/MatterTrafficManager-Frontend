import { useEffect, useRef } from 'react';
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
}

export function CalendarView({ 
  events = [], 
  onDateClick, 
  onEventClick, 
  onDatesChange,
  currentView = 'timeGridWeek'
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);

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
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
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
        weekends={true}
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
        
        .fc-col-header-cell-cushion,
        .fc-daygrid-day-number,
        .fc-timegrid-slot-label-cushion {
          color: hsl(var(--foreground));
        }
        
        .fc-theme-standard td,
        .fc-theme-standard th,
        .fc-theme-standard .fc-scrollgrid {
          border-color: var(--fc-border-color);
        }
        
        .fc-button-primary {
          background-color: var(--fc-button-bg-color);
          border-color: var(--fc-button-bg-color);
          color: var(--fc-button-text-color);
        }
        
        .fc-button-primary:hover {
          background-color: var(--fc-button-hover-bg-color);
          border-color: var(--fc-button-hover-bg-color);
        }
        
        .fc-button-primary:disabled {
          background-color: var(--fc-button-bg-color);
          border-color: var(--fc-button-bg-color);
          opacity: 0.5;
        }
        
        .fc-button-active {
          background-color: var(--fc-button-hover-bg-color) !important;
        }
        
        .fc-day-today {
          background-color: var(--fc-today-bg-color) !important;
        }
        
        .fc-timegrid-slot-minor {
          border-top-style: dotted;
        }
        
        .fc-event {
          cursor: pointer;
        }
        
        .fc-event:hover {
          filter: brightness(0.9);
        }
        
        /* Dark mode specific text fixes */
        .dark .fc-col-header-cell-cushion,
        .dark .fc-daygrid-day-number,
        .dark .fc-timegrid-slot-label-cushion,
        .dark .fc-toolbar-title {
          color: hsl(var(--foreground));
        }
      `}</style>
    </div>
  );
}
import { useEffect, useRef, forwardRef, createElement, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { EventInput } from '@fullcalendar/core';
import { ViewConfig } from '@/types/calendar.types';
import { FullCalendarTaskCard } from './FullCalendarTaskCard';
import { generateDayHeaderContent, generateDayCellContent } from '@/utils/calendarBadges';
import { format } from 'date-fns';
import ReactDOM from 'react-dom';

interface CalendarViewProps {
  events?: EventInput[];
  onDateClick?: (info: any) => void;
  onEventClick?: (info: any) => void;
  onDatesChange?: (start: Date, end: Date) => void;
  onNavLinkDayClick?: (date: Date) => void;
  onEventDrop?: (info: any) => void;
  onEventResize?: (info: any) => void;
  onSelect?: (info: any) => void;
  currentView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
  currentDate?: Date;
  showWeekends?: boolean;
  viewConfig?: ViewConfig;
}

export const CalendarView = forwardRef<FullCalendar, CalendarViewProps>(
  (
    {
      events = [],
      onDateClick,
      onEventClick,
      onDatesChange,
      onNavLinkDayClick,
      onEventDrop,
      onEventResize,
      onSelect,
      currentView = 'timeGridWeek',
      currentDate,
      showWeekends = true,
      viewConfig,
    },
    ref
  ) => {
    const internalRef = useRef<FullCalendar>(null);
    // Use the forwarded ref if provided, otherwise use internal ref
    const actualRef = ref || internalRef;

    // État pour le tooltip de resize
    const [resizeTooltip, setResizeTooltip] = useState<{
      visible: boolean;
      x: number;
      y: number;
      timeRange: string;
    } | null>(null);

    // Navigate to currentDate when it changes or view changes
    useEffect(() => {
      // Access the ref correctly - check if it's a forwarded ref or internal
      const fcRef = typeof actualRef === 'function' ? internalRef : actualRef;

      if (currentDate && fcRef.current) {
        const api = fcRef.current.getApi();
        if (api) {
          // Small delay to let view change settle
          const timer = setTimeout(() => {
            api.gotoDate(currentDate);
          }, 10);
          return () => clearTimeout(timer);
        }
      }
    }, [currentDate, currentView, actualRef]);

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
        attributeFilter: ['class'],
      });

      return () => observer.disconnect();
    }, []);

    // Gérer l'annulation du drag avec ESC pour FullCalendar
    const escPressedRef = useRef(false);
    const isDraggingRef = useRef(false);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isDraggingRef.current) {
          escPressedRef.current = true;
          console.log('ESC pressé pendant le drag - le drop sera annulé');
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
      <div className='calendar-container h-full'>
        <FullCalendar
          ref={actualRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView}
          initialDate={currentDate || new Date()}
          locale={frLocale}
          headerToolbar={false}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
            startTime: '08:00',
            endTime: '20:00',
          }}
          slotMinTime='08:00:00'
          slotMaxTime='20:00:00'
          slotDuration='00:30:00'
          snapDuration='00:15:00'
          height='auto'
          contentHeight='auto'
          aspectRatio={1.8}
          weekends={showWeekends}
          editable={true}
          eventResizableFromStart={true}
          eventDurationEditable={true}
          eventConstraint={{
            startTime: '08:00',
            endTime: '20:00',
          }}
          droppable={true}
          selectable={true}
          selectMirror={true}
          select={info => {
            console.log('📅 Sélection calendrier:', {
              start: info.start,
              end: info.end,
              allDay: info.allDay,
              view: info.view.type,
            });
            if (onSelect) {
              onSelect(info);
            }
          }}
          eventDragMinDistance={5}
          dayMaxEvents={currentView === 'dayGridMonth' ? 3 : false}
          dayMaxEventRows={currentView === 'timeGridWeek' ? 2 : false}
          moreLinkClick='popover'
          events={
            currentView === 'timeGridWeek' || currentView === 'dayGridMonth'
              ? events?.filter(event => !event.extendedProps?.isBadgeOnly)
              : events
          }
          dateClick={onDateClick}
          eventClick={onEventClick}
          eventDragStart={info => {
            // Add dragging class for visual feedback
            info.el.classList.add('fc-dragging');
            isDraggingRef.current = true;
            escPressedRef.current = false; // Réinitialiser le flag ESC
          }}
          eventDragStop={info => {
            // Remove dragging class
            info.el.classList.remove('fc-dragging');
            isDraggingRef.current = false;
          }}
          eventDrop={info => {
            // Si ESC a été pressé, on annule le drop
            if (escPressedRef.current) {
              info.revert();
              console.log('Drop annulé suite à ESC');
              escPressedRef.current = false;
              return;
            }
            // Sinon on traite le drop normalement
            if (onEventDrop) {
              onEventDrop(info);
            }
          }}
          eventResizeStart={info => {
            console.log('Resize start:', info.event.title);

            // Afficher le tooltip de resize
            const start = info.event.start;
            const end = info.event.end;
            if (start && end) {
              setResizeTooltip({
                visible: true,
                x: info.jsEvent.clientX,
                y: info.jsEvent.clientY - 40, // Au-dessus de la souris
                timeRange: `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
              });
            }
          }}
          eventResize={info => {
            console.log('Resize:', info.event.title, 'New duration:', info.event.end);

            // Mettre à jour le tooltip pendant le resize
            const newStart = info.event.start;
            const newEnd = info.event.end;

            if (newStart && newEnd) {
              setResizeTooltip(prev => {
                if (!prev) return null;

                return {
                  ...prev,
                  // Garder la position existante si jsEvent n'est pas disponible
                  x: info.jsEvent ? info.jsEvent.clientX : prev.x,
                  y: info.jsEvent ? info.jsEvent.clientY - 40 : prev.y,
                  timeRange: `${format(newStart, 'HH:mm')} - ${format(newEnd, 'HH:mm')}`,
                };
              });
            }

            if (onEventResize) {
              onEventResize(info);
            }
          }}
          eventResizeStop={info => {
            console.log('Resize stop:', info.event.title);

            // Masquer le tooltip
            setResizeTooltip(null);
          }}
          eventDisplay='block'
          // Rendu personnalisé des events avec TaskCard - À améliorer pour week/month views
          eventContent={eventInfo =>
            createElement(FullCalendarTaskCard, {
              eventInfo,
              viewConfig,
            })
          }
          // Personnalisation des headers de colonnes pour afficher les badges
          dayHeaderContent={arg => {
            // Uniquement pour la vue semaine
            if (currentView === 'timeGridWeek' && events) {
              return generateDayHeaderContent(events, arg.date, arg.text);
            }
            // Pour les autres vues, garder le comportement par défaut
            return arg.text;
          }}
          // Personnalisation des cellules de jour pour la vue mois
          dayCellContent={arg => {
            // Uniquement pour la vue mois
            if (currentView === 'dayGridMonth' && events) {
              // Extraire le numéro du jour depuis arg.dayNumberText
              const dayNumber = arg.dayNumberText || new Date(arg.date).getDate().toString();
              return generateDayCellContent(events, arg.date, dayNumber);
            }
            // Pour les autres vues, garder le comportement par défaut
            return arg.dayNumberText;
          }}
          // Callbacks pour détecter les changements de vue et de dates
          datesSet={dateInfo => {
            // Appelé quand les dates visibles changent (navigation ou changement de vue)
            if (onDatesChange) {
              onDatesChange(dateInfo.start, dateInfo.end);
            }
          }}
          // Options pour améliorer l'affichage
          weekNumbers={false}
          navLinks={true} // Permet de cliquer sur les jours/semaines pour naviguer
          navLinkDayClick={date => {
            // Navigation vers la vue jour
            if (onNavLinkDayClick) {
              onNavLinkDayClick(date);
            }
          }}
          navLinkWeekClick={weekDate => {
            // Navigation vers la vue semaine (optionnel)
            console.log('Week clicked:', weekDate);
          }}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
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
        
        /* Navigation links styling */
        .fc-daygrid-day-number,
        .fc-col-header-cell-cushion {
          color: hsl(var(--primary));
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .fc-daygrid-day-number:hover,
        .fc-col-header-cell-cushion:hover {
          color: hsl(var(--primary) / 0.8);
          text-decoration: underline;
        }
        
        /* Week view header dates should be clickable */
        .fc-timegrid-axis-cushion {
          cursor: default;
        }
        
        .fc-col-header-cell {
          position: relative;
        }
        
        .fc-col-header-cell:hover {
          background-color: hsl(var(--accent) / 0.1);
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
          height: 2.5rem; /* Reduced height for 8h-20h */
        }
        
        .fc-timegrid-slot-minor {
          border-top-style: dotted;
          border-color: hsl(var(--border) / 0.3);
        }
        
        /* Events styling - Make FullCalendar container a flexbox */
        .fc-event {
          cursor: pointer;
          border: none !important;
          padding: 0 !important;
          overflow: visible;
          background-color: transparent !important;
          display: flex !important;
          flex-direction: column !important;
        }
        
        .fc-event:hover {
          filter: brightness(0.95);
        }
        
        .fc-event-main {
          padding: 0 !important;
          overflow: visible;
          background-color: transparent !important;
          flex: 1 !important;
          display: flex !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        /* Remove FullCalendar's default event colors */
        .fc-event,
        .fc-event-dot {
          background-color: transparent !important;
        }
        
        .fc-h-event,
        .fc-v-event {
          background-color: transparent !important;
          border-color: transparent !important;
        }
        
        /* Ensure event content fills the container */
        .fc-event-main-frame {
          flex: 1 !important;
          display: flex !important;
        }
        
        /* All-day section styling */
        .fc-timegrid-divider {
          background: hsl(var(--muted) / 0.3);
          border-bottom: 2px solid hsl(var(--border));
        }
        
        /* All-day events in week view */
        .fc-timegrid .fc-daygrid-body {
          background: hsl(var(--muted) / 0.2);
          border-bottom: 2px solid hsl(var(--border));
        }
        
        /* Remove unwanted grid lines in all-day section */
        .fc-timegrid .fc-daygrid-day {
          border-left: none !important;
          border-right: none !important;
        }
        
        .fc-timegrid .fc-daygrid-day-frame {
          border: none !important;
        }
        
        /* Drag & Drop styling */
        .fc-dragging {
          opacity: 0.75 !important;
          cursor: grabbing !important;
        }
        
        .fc-event-mirror {
          opacity: 0.6 !important;
          background: hsl(var(--primary) / 0.3) !important;
        }
        
        .fc-event-dragging {
          z-index: 9999 !important;
        }
        
        .fc-timegrid .fc-daygrid-day-events {
          min-height: 1.5rem;
          padding: 0.25rem 0;
        }
        
        /* Hide grid lines but keep events visible */
        .fc-timegrid .fc-daygrid-day-bg {
          display: none;
        }
        
        /* Style for all-day events */
        .fc-timegrid .fc-daygrid-event {
          margin: 0.125rem 0.25rem;
          padding: 0 !important;
        }
        
        .fc-timegrid .fc-daygrid-event-harness {
          margin: 0;
        }
        
        /* More link for all-day section */
        .fc-timegrid .fc-daygrid-more-link {
          color: hsl(var(--primary));
          font-weight: 500;
          font-size: 0.75rem;
          margin-left: 0.25rem;
        }
        
        /* Week view specific - better spacing for overlapping events */
        .fc-timegrid-event {
          margin-bottom: 1px;
        }

        .fc-timegrid-event-harness {
          margin-right: 2px;
        }
        
        /* Month view - ensure events have enough height */
        .fc-daygrid-event {
          min-height: 20px;
          margin-bottom: 1px;
        }
        
        .fc-daygrid-event-harness {
          margin-left: 2px;
          margin-right: 2px;
        }
        
        /* More events link styling */
        .fc-daygrid-more-link {
          color: hsl(var(--primary));
          font-weight: 500;
          font-size: 0.75rem;
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
        
        /* Fix day cell content width */
        .fc-daygrid-day-top {
          width: 100%;
        }
        
        .fc-daygrid-day-top .fc-daygrid-day-number {
          width: 100%;
        }
        
        .day-cell-content-wrapper {
          width: 100%;
          display: block;
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

        {/* Tooltip de redimensionnement - Rendu via portal */}
        {resizeTooltip?.visible &&
          ReactDOM.createPortal(
            <div
              className='fixed z-[9999] px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg pointer-events-none'
              style={{
                left: resizeTooltip.x,
                top: resizeTooltip.y,
              }}
            >
              {resizeTooltip.timeRange}
            </div>,
            document.body
          )}
      </div>
    );
  }
);

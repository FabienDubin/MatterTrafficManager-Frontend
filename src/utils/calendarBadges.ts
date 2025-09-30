import { EventInput } from '@fullcalendar/core';
import { createElement } from 'react';
import { CalendarHeaderBadges } from '@/components/calendar/CalendarHeaderBadges';
import { createRoot } from 'react-dom/client';

// Map des types de tâches spéciales vers leurs emojis
const TASK_TYPE_EMOJIS: Record<string, string> = {
  holiday: '🏖️',
  remote: '🏠',
  school: '📚',
};

export interface BadgeInfo {
  emoji: string;
  name: string;
  type: string;
}

/**
 * Récupère les tâches spéciales (congés, TT, école) pour une date donnée
 */
export function getSpecialTasksForDate(events: EventInput[], date: Date): BadgeInfo[] {
  const badges: BadgeInfo[] = [];

  events.forEach(event => {
    // Vérifier si c'est une tâche all-day qui doit être splittée (badges)
    if (event.allDay && event.extendedProps?.task?.shouldSplitDaily) {
      const task = event.extendedProps.task;
      const taskType = task.taskType;

      // Vérifier si c'est un type spécial avec emoji
      if (taskType && TASK_TYPE_EMOJIS[taskType]) {
        // Vérifier si la date correspond
        const eventStart = new Date(event.start as string);
        const eventEnd = event.end ? new Date(event.end as string) : eventStart;

        // Pour les événements all-day, vérifier si la date est dans la plage
        if (date >= eventStart && date < eventEnd) {
          // Récupérer le prénom depuis les données des membres
          const memberName = task.assignedMembersData?.[0]?.name || 'Inconnu';
          const firstName = memberName.split(' ')[0]; // Prendre juste le prénom

          badges.push({
            emoji: TASK_TYPE_EMOJIS[taskType],
            name: firstName,
            type: taskType,
          });
        }
      }
    }
  });

  return badges;
}

/**
 * Génère le contenu React pour afficher les badges dans le header
 */
export function renderBadgeReact(badges: BadgeInfo[], maxVisible: number = 3) {
  if (badges.length === 0) {
    return null;
  }

  // Create a container element and render React component into it
  const container = document.createElement('div');
  container.className = 'day-header-badges-container';

  const root = createRoot(container);
  root.render(createElement(CalendarHeaderBadges, { badges, maxVisible }));

  // Return the DOM element which FullCalendar will insert
  return { domNodes: [container] };
}

/**
 * Génère le contenu complet du header avec date et badges
 */
export function generateDayHeaderContent(events: EventInput[], date: Date, defaultText: string) {
  const badges = getSpecialTasksForDate(events, date);

  // Create wrapper div with date and badges
  const wrapper = document.createElement('div');
  wrapper.className = 'day-header-wrapper';

  // Add date element
  const dateElement = document.createElement('div');
  dateElement.className = 'day-header-date';
  dateElement.textContent = defaultText;
  wrapper.appendChild(dateElement);

  // Add badges if any
  if (badges.length > 0) {
    const badgesContainer = document.createElement('div');
    const root = createRoot(badgesContainer);
    root.render(createElement(CalendarHeaderBadges, { badges, maxVisible: 3 }));
    wrapper.appendChild(badgesContainer);
  }

  return { domNodes: [wrapper] };
}

/**
 * Génère le contenu d'une cellule de jour pour la vue mois avec badges
 */
export function generateDayCellContent(events: EventInput[], date: Date, dayNumberText: string) {
  const badges = getSpecialTasksForDate(events, date);

  // Create wrapper div with badges and day number
  const wrapper = document.createElement('div');
  wrapper.className = 'day-cell-content-wrapper';

  // Container for badges and day number on same line
  const headerLine = document.createElement('div');
  headerLine.className = 'day-cell-header';

  // Add badges first (on the left)
  if (badges.length > 0) {
    const badgesContainer = document.createElement('span');
    badgesContainer.className = 'day-cell-badges';
    const root = createRoot(badgesContainer);
    root.render(createElement(CalendarHeaderBadges, { badges, maxVisible: 2 })); // Max 2 in month view for space
    headerLine.appendChild(badgesContainer);
  }

  // Add day number (on the right)
  const dayNumber = document.createElement('span');
  dayNumber.className = 'day-cell-number';
  dayNumber.textContent = dayNumberText;
  headerLine.appendChild(dayNumber);

  wrapper.appendChild(headerLine);

  return { domNodes: [wrapper] };
}

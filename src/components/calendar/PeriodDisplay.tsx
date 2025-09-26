import { format, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarViewType } from './ViewSwitcher';

interface PeriodDisplayProps {
  currentDate: Date;
  currentView: CalendarViewType;
}

export function PeriodDisplay({ currentDate, currentView }: PeriodDisplayProps) {
  const formatPeriod = () => {
    switch (currentView) {
      case 'day':
        // Format: "Vendredi 26 Septembre 2025"
        return format(currentDate, 'EEEE d MMMM yyyy', { locale: fr });
      
      case 'week':
        // Format: "23 - 29 Septembre 2025" ou "29 Sept - 5 Oct 2025"
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          // Même mois
          return `${format(weekStart, 'd')} - ${format(weekEnd, 'd MMMM yyyy', { locale: fr })}`;
        } else if (weekStart.getFullYear() === weekEnd.getFullYear()) {
          // Mois différents, même année
          return `${format(weekStart, 'd MMM', { locale: fr })} - ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`;
        } else {
          // Années différentes
          return `${format(weekStart, 'd MMM yyyy', { locale: fr })} - ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`;
        }
      
      case 'month':
        // Format: "Septembre 2025"
        return format(currentDate, 'MMMM yyyy', { locale: fr });
      
      default:
        return '';
    }
  };

  return (
    <h2 className="text-xl font-semibold capitalize">
      {formatPeriod()}
    </h2>
  );
}
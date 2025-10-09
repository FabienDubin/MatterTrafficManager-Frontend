import { useCallback } from 'react';
import { useHolidays } from './useHolidays';
import { toast } from 'sonner';

interface UseHolidayAlertProps {
  date?: Date; // Optionnel pour usage dynamique
  startDate?: Date; // Pour période (ex: CalendarView)
  endDate?: Date;
}

/**
 * Hook pour centraliser les alertes de jours fériés
 * Fournit des handlers wrapper qui ajoutent automatiquement les toasts d'alerte
 */
export function useHolidayAlert({ date, startDate, endDate }: UseHolidayAlertProps = {}) {
  // Hook pour détecter les jours fériés pour la période ou date
  const holidays = useHolidays({
    startDate: startDate || date || new Date(),
    endDate: endDate || date || new Date(),
  });

  // Fonction pour afficher l'alerte pour une date donnée
  const showHolidayAlert = useCallback((targetDate: Date) => {
    if (!holidays.showHolidays) return;
    
    const isHolidayDate = holidays.isHoliday(targetDate);
    if (isHolidayDate) {
      const holidayName = holidays.getHolidayName(targetDate);
      toast.warning(`Attention: ${holidayName} - Jour férié !`, {
        description: 'Tu peux quand même créer cette tâche.',
        duration: 4000,
      });
    }
  }, [holidays]);

  // Version pour date fixe (DayView)
  const showHolidayAlertForCurrentDate = useCallback(() => {
    if (date) {
      showHolidayAlert(date);
    }
  }, [date, showHolidayAlert]);

  // Wrapper pour les handlers qui créent des tâches (date fixe)
  const withHolidayAlert = useCallback(<T extends unknown[]>(handler?: (...args: T) => void) => {
    if (!handler) return undefined;
    
    return (...args: T) => {
      showHolidayAlertForCurrentDate();
      handler(...args);
    };
  }, [showHolidayAlertForCurrentDate]);

  return {
    isPublicHoliday: date ? holidays.isHoliday(date) : false,
    showHolidayAlert, // Pour usage dynamique
    showHolidayAlertForCurrentDate, // Pour date fixe  
    withHolidayAlert, // Wrapper pour handlers
  };
}
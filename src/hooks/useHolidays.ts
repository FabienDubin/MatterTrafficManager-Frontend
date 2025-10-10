import { useState, useEffect, useMemo } from 'react';
import { holidaysService, Holiday } from '@/services/api/holidays.service';
import { useCalendarConfigStore } from '@/store/calendar-config.store';

interface UseHolidaysProps {
  startDate: Date;
  endDate: Date;
}

interface UseHolidaysReturn {
  holidays: Holiday[];
  isLoading: boolean;
  error: string | null;
  isHoliday: (date: Date) => boolean;
  getHolidayName: (date: Date) => string | null;
  showHolidays: boolean;
}

/**
 * Hook pour gérer les jours fériés dans le calendrier
 * Récupère les jours fériés pour la période visible et fournit des utilitaires
 */
/**
 * Récupère tous les jours fériés pour une période donnée via le service
 */
async function getHolidaysInRange(startDate: Date, endDate: Date): Promise<Holiday[]> {
  const holidays: Holiday[] = [];
  const yearsToFetch = new Set<number>();
  
  // Identifier toutes les années dans la période
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    yearsToFetch.add(currentDate.getFullYear());
    currentDate.setFullYear(currentDate.getFullYear() + 1);
    currentDate = new Date(currentDate.getFullYear(), 0, 1);
  }
  
  // Récupérer les jours fériés pour chaque année via le service
  for (const year of yearsToFetch) {
    try {
      const yearHolidays = await holidaysService.getHolidays(year);
      
      for (const [dateString, name] of Object.entries(yearHolidays)) {
        const holidayDate = new Date(dateString + 'T00:00:00');
        
        if (holidayDate >= startDate && holidayDate <= endDate) {
          holidays.push({
            date: dateString,
            name,
          });
        }
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération des jours fériés pour ${year}:`, error);
    }
  }
  
  holidays.sort((a, b) => a.date.localeCompare(b.date));
  return holidays;
}

/**
 * Vérifie si une date donnée est un jour férié
 */
async function isHolidayDate(date: Date): Promise<boolean> {
  const year = date.getFullYear();
  const dateString = formatDateToString(date);
  
  try {
    const holidays = await holidaysService.getHolidays(year);
    return dateString in holidays;
  } catch {
    return false;
  }
}

/**
 * Récupère le nom du jour férié pour une date donnée
 */
async function getHolidayNameForDate(date: Date): Promise<string | null> {
  const year = date.getFullYear();
  const dateString = formatDateToString(date);
  
  try {
    const holidays = await holidaysService.getHolidays(year);
    return holidays[dateString] || null;
  } catch {
    return null;
  }
}

/**
 * Formate une date en string YYYY-MM-DD (format API)
 */
function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useHolidays({ startDate, endDate }: UseHolidaysProps): UseHolidaysReturn {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Récupérer la configuration pour savoir si les jours fériés sont activés
  const { config } = useCalendarConfigStore();
  const showHolidays = config?.showHolidays ?? true;

  // Récupérer les jours fériés quand les dates changent ou quand la config change
  useEffect(() => {
    if (!showHolidays) {
      setHolidays([]);
      return;
    }

    let isCancelled = false;

    const fetchHolidays = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const fetchedHolidays = await getHolidaysInRange(startDate, endDate);
        
        if (!isCancelled) {
          setHolidays(fetchedHolidays);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Erreur lors du chargement des jours fériés');
          setHolidays([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchHolidays();

    return () => {
      isCancelled = true;
    };
  }, [startDate, endDate, showHolidays]);

  // Créer un Set pour des lookups rapides
  const holidayDatesSet = useMemo(() => {
    return new Set(holidays.map(h => h.date));
  }, [holidays]);

  // Créer un Map pour les noms des jours fériés
  const holidayNamesMap = useMemo(() => {
    return new Map(holidays.map(h => [h.date, h.name]));
  }, [holidays]);

  // Fonction pour vérifier si une date est un jour férié
  const checkIsHoliday = (date: Date): boolean => {
    if (!showHolidays) return false;
    
    const dateString = formatDateToString(date);
    return holidayDatesSet.has(dateString);
  };

  // Fonction pour récupérer le nom d'un jour férié
  const getHolidayName = (date: Date): string | null => {
    if (!showHolidays) return null;
    
    const dateString = formatDateToString(date);
    return holidayNamesMap.get(dateString) || null;
  };

  return {
    holidays,
    isLoading,
    error,
    isHoliday: checkIsHoliday,
    getHolidayName: getHolidayName,
    showHolidays,
  };
}
// Service pour gérer les jours fériés français
// Utilise l'API officielle data.gouv.fr

// Cache en mémoire pour éviter les appels répétés
const holidaysCache = new Map<number, Record<string, string>>();

export interface Holiday {
  date: string; // Format YYYY-MM-DD
  name: string;
}

/**
 * Récupère les jours fériés français pour une année donnée
 * Utilise l'API officielle calendrier.api.gouv.fr
 */
export async function getHolidays(year: number): Promise<Record<string, string>> {
  // Vérifier le cache d'abord
  if (holidaysCache.has(year)) {
    return holidaysCache.get(year)!;
  }

  try {
    const response = await fetch(
      `https://calendrier.api.gouv.fr/jours-feries/metropole/${year}.json`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const holidays = await response.json();

    // Mettre en cache
    holidaysCache.set(year, holidays);
    return holidays;
  } catch (error) {
    console.error(`Erreur lors de la récupération des jours fériés pour ${year}:`, error);

    // Retourner un objet vide en cas d'erreur
    return {};
  }
}

/**
 * Vérifie si une date donnée est un jour férié
 */
export async function isHoliday(date: Date): Promise<boolean> {
  const year = date.getFullYear();
  const dateString = formatDateToString(date);

  try {
    const holidays = await getHolidays(year);
    return dateString in holidays;
  } catch {
    return false;
  }
}

/**
 * Récupère le nom du jour férié pour une date donnée
 */
export async function getHolidayName(date: Date): Promise<string | null> {
  const year = date.getFullYear();
  const dateString = formatDateToString(date);

  try {
    const holidays = await getHolidays(year);
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

/**
 * Récupère tous les jours fériés pour une période donnée
 * Utile pour l'affichage du calendrier
 */
export async function getHolidaysInRange(startDate: Date, endDate: Date): Promise<Holiday[]> {
  const holidays: Holiday[] = [];
  const yearsToFetch = new Set<number>();

  // Identifier toutes les années dans la période
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    yearsToFetch.add(currentDate.getFullYear());
    currentDate.setFullYear(currentDate.getFullYear() + 1);
    currentDate = new Date(currentDate.getFullYear(), 0, 1); // Premier jour de l'année suivante
  }

  // Récupérer les jours fériés pour chaque année
  for (const year of yearsToFetch) {
    try {
      const yearHolidays = await getHolidays(year);

      for (const [dateString, name] of Object.entries(yearHolidays)) {
        const holidayDate = new Date(dateString + 'T00:00:00'); // Éviter les problèmes de timezone

        // Vérifier si la date est dans la période demandée
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

  // Trier par date
  holidays.sort((a, b) => a.date.localeCompare(b.date));

  return holidays;
}

/**
 * Vide le cache des jours fériés
 * Utile pour forcer un rechargement
 */
export function clearHolidaysCache(): void {
  holidaysCache.clear();
}

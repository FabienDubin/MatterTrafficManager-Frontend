import { apiClient } from './client';

// Cache en mémoire pour éviter les appels répétés
const holidaysCache = new Map<number, Record<string, string>>();

export interface Holiday {
  date: string; // Format YYYY-MM-DD
  name: string;
}

export interface HolidaysResponse {
  success: boolean;
  data: Record<string, string>; // {"2025-12-25": "Jour de Noël"}
  meta: {
    year: number;
    count: number;
    source: string;
  };
}

/**
 * Service pour gérer les jours fériés français
 * Utilise l'API backend qui fait le proxy vers data.gouv.fr
 */
export const holidaysService = {
  /**
   * Récupère les jours fériés français pour une année donnée
   */
  async getHolidays(year: number): Promise<Record<string, string>> {
    // Vérifier le cache d'abord
    if (holidaysCache.has(year)) {
      return holidaysCache.get(year)!;
    }

    try {
      const response = await apiClient.get<HolidaysResponse>(`/holidays/${year}`);
      const holidays = response.data.data;
      
      // Mettre en cache
      holidaysCache.set(year, holidays);
      
      return holidays;
    } catch (error) {
      console.error(`Erreur lors de la récupération des jours fériés pour ${year}:`, error);
      
      // Retourner un objet vide en cas d'erreur
      return {};
    }
  },

  /**
   * Vide le cache des jours fériés
   * Utile pour forcer un rechargement
   */
  clearCache(): void {
    holidaysCache.clear();
  },
};
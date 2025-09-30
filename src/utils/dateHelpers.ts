/**
 * Arrondit une date au créneau de 15 minutes le plus proche
 * @param date La date à arrondir
 * @returns La date arrondie au quart d'heure le plus proche
 */
export function snapToQuarterHour(date: Date): Date {
  const result = new Date(date);
  const minutes = result.getMinutes();
  
  // Calculer le quart d'heure le plus proche
  const roundedMinutes = Math.round(minutes / 15) * 15;
  
  // Si on arrive à 60, passer à l'heure suivante
  if (roundedMinutes === 60) {
    result.setHours(result.getHours() + 1);
    result.setMinutes(0);
  } else {
    result.setMinutes(roundedMinutes);
  }
  
  // Réinitialiser les secondes et millisecondes
  result.setSeconds(0);
  result.setMilliseconds(0);
  
  return result;
}

/**
 * Arrondit une date au créneau de 15 minutes précédent
 * @param date La date à arrondir
 * @returns La date arrondie au quart d'heure précédent
 */
export function snapToQuarterHourFloor(date: Date): Date {
  const result = new Date(date);
  const minutes = result.getMinutes();
  
  // Arrondir vers le bas au quart d'heure
  const roundedMinutes = Math.floor(minutes / 15) * 15;
  result.setMinutes(roundedMinutes);
  
  // Réinitialiser les secondes et millisecondes
  result.setSeconds(0);
  result.setMilliseconds(0);
  
  return result;
}

/**
 * Arrondit une date au créneau de 15 minutes suivant
 * @param date La date à arrondir
 * @returns La date arrondie au quart d'heure suivant
 */
export function snapToQuarterHourCeil(date: Date): Date {
  const result = new Date(date);
  const minutes = result.getMinutes();
  
  // Arrondir vers le haut au quart d'heure
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  
  // Si on arrive à 60, passer à l'heure suivante
  if (roundedMinutes === 60) {
    result.setHours(result.getHours() + 1);
    result.setMinutes(0);
  } else {
    result.setMinutes(roundedMinutes);
  }
  
  // Réinitialiser les secondes et millisecondes
  result.setSeconds(0);
  result.setMilliseconds(0);
  
  return result;
}

/**
 * Calcule la durée entre deux dates arrondie aux quarts d'heure
 * @param startDate Date de début
 * @param endDate Date de fin
 * @returns Durée en minutes (multiple de 15)
 */
export function getQuarterHourDuration(startDate: Date, endDate: Date): number {
  const start = snapToQuarterHour(startDate);
  const end = snapToQuarterHour(endDate);
  
  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  
  // S'assurer que c'est un multiple de 15
  return Math.round(diffMinutes / 15) * 15;
}
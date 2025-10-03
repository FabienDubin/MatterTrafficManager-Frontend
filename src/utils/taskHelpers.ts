/**
 * Normalize task status from backend to frontend format
 */
export function normalizeTaskStatus(
  status: string
): 'not_started' | 'in_progress' | 'completed' {
  const normalized = status.toLowerCase();

  if (normalized === 'not_started' || normalized === 'pas commencé') {
    return 'not_started';
  }

  if (normalized === 'in_progress' || normalized === 'en cours' || normalized === 'a valider') {
    return 'in_progress';
  }

  if (normalized === 'completed' || normalized === 'terminé') {
    return 'completed';
  }

  return 'not_started';
}

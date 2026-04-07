// utils/dateHelpers.ts
export function parseSafeDate(dateString: string | Date): Date {
  if (dateString instanceof Date) return dateString;
  if (!dateString) return new Date();

  // Remplace l'espace par un 'T' pour forcer le format ISO reconnu par Safari
  // Exemple : "2026-04-07 14:30:00" -> "2026-04-07T14:30:00"
  let safeString = dateString.replace(' ', 'T');
  
  // Si le format utilise des slashes (ex: Safari aime YYYY/MM/DD)
  safeString = safeString.replace(/-/g, '/').replace('T', ' ');

  const parsedDate = new Date(safeString);
  
  // Fallback si la date est toujours invalide
  return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}
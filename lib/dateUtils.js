/**
 * Get current date in Trinidad timezone (POS, UTC-4)
 * @returns {Date} Date object at midnight in Trinidad timezone
 */
export function getTrinidadToday() {
  // Create a date in Trinidad timezone (UTC-4)
  const now = new Date();
  const trinidad = new Date(now.toLocaleString('en-US', { timeZone: 'America/Port_of_Spain' }));

  // Set to midnight
  trinidad.setHours(0, 0, 0, 0);

  return trinidad;
}

/**
 * Get date range for today in Trinidad timezone
 * @returns {Object} Object with startOfDay and endOfDay dates
 */
export function getTrinidadDateRange() {
  const today = getTrinidadToday();

  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

/**
 * Normalize a date to midnight in Trinidad timezone
 * @param {Date} date - Date to normalize
 * @returns {Date} Normalized date at midnight
 */
export function normalizeDateToTrinidad(date) {
  const trinidad = new Date(date.toLocaleString('en-US', { timeZone: 'America/Port_of_Spain' }));
  trinidad.setHours(0, 0, 0, 0);
  return trinidad;
}

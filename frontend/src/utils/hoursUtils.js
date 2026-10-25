/**
 * Distributes total hours across `count` items in 0.5 hour increments,
 * ensuring the sum strictly equals `totalHours`.
 *
 * Example:
 * 6.5h across 2 tickets -> [3.5, 3.0] (sum 6.5)
 * 6.5h across 3 tickets -> [2.5, 2.0, 2.0] (sum 6.5)
 * 7.0h across 2 tickets -> [3.5, 3.5] (sum 7.0)
 * 5.5h across 2 tickets -> [3.0, 2.5] (sum 5.5)
 */
export function distributeHoursInHalfHours(totalHours, count) {
  if (count <= 0) return [];
  const roundedTotal = Math.round(totalHours * 2) / 2;
  if (count === 1) return [roundedTotal];

  const totalUnits = Math.round(roundedTotal * 2); // each unit is 0.5h
  const baseUnits = Math.floor(totalUnits / count);
  const remainderUnits = totalUnits % count;

  const result = [];
  for (let i = 0; i < count; i++) {
    const units = baseUnits + (i < remainderUnits ? 1 : 0);
    result.push(units * 0.5);
  }
  return result;
}

/**
 * Rounds a number to the nearest 0.5 increment with a minimum bound.
 */
export function roundToHalfHour(val, min = 0.5) {
  const num = parseFloat(val) || 0;
  return Math.max(min, Math.round(num * 2) / 2);
}

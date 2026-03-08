/**
 * Calculate WHO standard drink units.
 * 1 standard unit = 10 ml of pure alcohol.
 *
 * @param volume_ml  - drink volume in millilitres
 * @param abv_percent - alcohol by volume as a percentage (e.g. 5 for 5%)
 * @param quantity   - number of drinks (must be >= 0)
 * @returns standard units (unrounded)
 */
export function calculateUnits(
  volume_ml: number,
  abv_percent: number,
  quantity: number = 1,
): number {
  if (quantity < 0) {
    throw new Error('quantity must be >= 0');
  }
  if (volume_ml <= 0 || abv_percent <= 0 || quantity === 0) {
    return 0;
  }
  return quantity * (volume_ml * abv_percent) / 1000;
}

/** Round units to 1 decimal for display */
export function displayUnits(units: number): number {
  return Math.round(units * 10) / 10;
}

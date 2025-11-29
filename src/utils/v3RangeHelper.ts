/**
 * Génère un range artificiel V3 pour les pools V2 (full range)
 * @param currentPrice Prix actuel (optionnel, pour centrer le range)
 * @returns Range artificiel très large pour simuler un pool V2
 */
export function generateV3RangeForV2Pool(currentPrice?: number): {
  valueLower: number;
  valueUpper: number;
} {
  // Range très large pour simuler un pool V2 "full range"
  // Ces valeurs garantissent que le boost sera minimal (équivalent V2)
  const valueLower = 1e-7; // 0.0000001
  const valueUpper = 1e7; // 10000000

  return {
    valueLower,
    valueUpper,
  };
}


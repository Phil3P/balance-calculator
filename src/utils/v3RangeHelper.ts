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

/**
 * Constantes pour les pools V2 full range (identique aux pools V3 full range)
 */
const TICK_BASE = 1.0001;
const V2_FULL_RANGE_TICK_LOWER = -887200;
const V2_FULL_RANGE_TICK_UPPER = 887200;

/**
 * Transforme les données d'une pool V2 en format V3 full range
 * @param balance Balance du token à transformer
 * @param allBalances Toutes les balances du même pool (pour calculer currentPrice)
 * @returns Balance transformée avec les champs V3
 */
export function transformV2ToV3FullRange(
  balance: any,
  allBalances: any[]
): {
  positionId: number;
  isActive: boolean;
  tickLower: number;
  tickUpper: number;
  currentTick: number;
  currentPrice: string;
  minPrice: number;
  maxPrice: number;
  tokenPosition: number;
} {
  // Trouver l'autre token de la même position (même poolAddress)
  const poolBalances = allBalances.filter((b) => b.poolAddress === balance.poolAddress);
  
  // Déterminer tokenPosition : 0 pour le premier token, 1 pour le second
  // Pour V2, on utilise l'ordre alphabétique des symboles ou la présence de REG
  let tokenPosition = 0;
  if (poolBalances.length >= 2) {
    // Trier par ordre alphabétique pour avoir un ordre cohérent
    const sorted = [...poolBalances].sort((a, b) => a.tokenSymbol.localeCompare(b.tokenSymbol));
    tokenPosition = sorted.indexOf(balance);
  }

  // Calculer currentPrice = tokenBalance(token1) / tokenBalance(token0)
  // Pour V2, on utilise les tokenBalance des deux tokens de la même position
  // Le prix est calculé comme : montant token1 (en unités réelles) / montant token0 (en unités réelles)
  let currentPrice = 1;
  if (poolBalances.length >= 2) {
    // Trier par ordre alphabétique pour avoir token0 et token1
    const sorted = [...poolBalances].sort((a, b) => a.tokenSymbol.localeCompare(b.tokenSymbol));
    const token0 = sorted[0];
    const token1 = sorted[1];
    
    const balance0 = parseFloat(token0.tokenBalance || "0");
    const balance1 = parseFloat(token1.tokenBalance || "0");
    
    if (balance0 > 0) {
      // Ajuster selon les decimals pour avoir les montants réels
      const decimals0 = token0.tokenDecimals || 18;
      const decimals1 = token1.tokenDecimals || 18;
      const adjustedBalance0 = balance0 / Math.pow(10, decimals0);
      const adjustedBalance1 = balance1 / Math.pow(10, decimals1);
      
      if (adjustedBalance0 > 0) {
        // currentPrice = montant token1 / montant token0
        // C'est le prix du token0 en termes de token1
        currentPrice = adjustedBalance1 / adjustedBalance0;
      }
    }
  }

  // Calculer currentTick = ln(current_price) / ln(1.0001)
  // Protection contre les valeurs négatives ou nulles
  if (currentPrice <= 0) {
    currentPrice = 1;
  }
  const currentTick = Math.log(currentPrice) / Math.log(TICK_BASE);

  // Calculer minPrice et maxPrice à partir des ticks
  const minPrice = Math.pow(TICK_BASE, V2_FULL_RANGE_TICK_LOWER);
  const maxPrice = Math.pow(TICK_BASE, V2_FULL_RANGE_TICK_UPPER);

  // positionId : 0 ou 1 selon tokenPosition pour un même poolAddress
  // Pour V2, on utilise tokenPosition comme positionId
  const positionId = tokenPosition;

  return {
    positionId,
    isActive: true, // V2 full range = toujours actif
    tickLower: V2_FULL_RANGE_TICK_LOWER,
    tickUpper: V2_FULL_RANGE_TICK_UPPER,
    currentTick,
    currentPrice: currentPrice.toString(),
    minPrice,
    maxPrice,
    tokenPosition,
  };
}


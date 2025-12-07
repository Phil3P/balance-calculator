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
const REG_ADDRESS = "0x0aa1e96d2a46ec6beb2923de1e61addf5f5f1dce".toLowerCase();

/**
 * Transforme un pool V2 en format V3 full range
 * @param poolBalances Les deux tokens du pool (doit contenir exactement 2 tokens)
 * @param positionId ID unique pour cette position
 * @returns Les deux balances transformées avec les champs V3
 */
export function transformV2PoolToV3FullRange(
  poolBalances: any[],
  positionId: number
): any[] {
  if (poolBalances.length !== 2) {
    throw new Error(`Expected exactly 2 tokens in pool, got ${poolBalances.length}`);
  }

  // Dédupliquer par tokenAddress (au cas où)
  const uniqueTokens = new Map<string, any>();
  poolBalances.forEach((token) => {
    const addr = token.tokenAddress?.toLowerCase();
    if (addr) {
      uniqueTokens.set(addr, token);
    }
  });

  const tokens = Array.from(uniqueTokens.values());
  if (tokens.length !== 2) {
    throw new Error(`Expected exactly 2 unique tokens in pool, got ${tokens.length}`);
  }

  // ★★★★★ FORCE REG AS token0 ★★★★★ (comme dans le script Python)
  const addr0 = tokens[0].tokenAddress?.toLowerCase() || "";
  const addr1 = tokens[1].tokenAddress?.toLowerCase() || "";

  let token0: any;
  let token1: any;

  if (addr0 === REG_ADDRESS) {
    token0 = tokens[0];
    token1 = tokens[1];
  } else if (addr1 === REG_ADDRESS) {
    token0 = tokens[1];
    token1 = tokens[0];
  } else {
    // Si pas de REG dans le pool, trier par ordre alphabétique
    if (addr0 < addr1) {
      token0 = tokens[0];
      token1 = tokens[1];
    } else {
      token0 = tokens[1];
      token1 = tokens[0];
    }
  }

  // Calculer currentPrice = tokenBalance(token1) / tokenBalance(token0)
  // Les tokenBalance sont déjà en unités réelles (pas besoin d'ajuster les decimals)
  const balance0 = parseFloat(token0.tokenBalance || "0");
  const balance1 = parseFloat(token1.tokenBalance || "0");

  let currentPrice = 1;
  if (balance0 > 0) {
    currentPrice = balance1 / balance0;
  }

  // Calculer currentTick = ln(current_price) / ln(1.0001)
  if (currentPrice <= 0) {
    currentPrice = 1;
  }
  const currentTick = Math.log(currentPrice) / Math.log(TICK_BASE);

  // Calculer minPrice et maxPrice à partir des ticks
  const minPrice = Math.pow(TICK_BASE, V2_FULL_RANGE_TICK_LOWER);
  const maxPrice = Math.pow(TICK_BASE, V2_FULL_RANGE_TICK_UPPER);

  // Créer les deux entrées V3 (comme dans le script Python)
  return [
    {
      ...token0,
      positionId,
      tokenPosition: 0,
      isActive: true,
      tickLower: V2_FULL_RANGE_TICK_LOWER,
      tickUpper: V2_FULL_RANGE_TICK_UPPER,
      currentTick,
      currentPrice: currentPrice.toString(),
      minPrice,
      maxPrice,
    },
    {
      ...token1,
      positionId,
      tokenPosition: 1,
      isActive: true,
      tickLower: V2_FULL_RANGE_TICK_LOWER,
      tickUpper: V2_FULL_RANGE_TICK_UPPER,
      currentTick,
      currentPrice: currentPrice.toString(),
      minPrice,
      maxPrice,
    },
  ];
}


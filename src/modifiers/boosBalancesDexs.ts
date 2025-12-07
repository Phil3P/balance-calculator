import { BigNumber } from "bignumber.js";
import { DexValue, Network } from "../configs/constantes.js";
import { i18n } from "../i18n/index.js";
import { SourceBalancesREG } from "../types/REG.types.js";
import { NormalizeOptions } from "../types/inputModles.types.js";

/**
 * Modifie les balances des DEX en fonction des options spécifiées
 * @param data Données d'entrée de type SourceBalancesREG[]
 * @param options Options de boost des balances des DEX
 * Les options sont de type { [key in DexValue]?: [string[], number[]] }
 * string[] est un tableau de symboles de tokens à booster ou '*' pour tous les tokens
 * number[] est un tableau de facteurs de boost correspondants
 * @returns Données modifiées de type SourceBalancesREG[]
 */
import { BigNumber } from "bignumber.js";
import { DexValue, Network } from "../configs/constantes.js";
import { i18n } from "../i18n/index.js";
import { SourceBalancesREG } from "../types/REG.types.js";
import { NormalizeOptions } from "../types/inputModles.types.js";

/**
 * Vérifie si une position a un token à zéro
 * @param dexBalances Toutes les balances du DEX
 * @param positionId ID de la position à vérifier
 * @param poolAddress Adresse du pool
 * @returns true si la position a un token avec balance à zéro
 */
function hasZeroTokenInPosition(
  dexBalances: Array<{
    positionId?: number;
    poolAddress: string;
    tokenBalance: string;
  }>,
  positionId: number,
  poolAddress: string
): boolean {
  // Trouver toutes les balances de la même position (même positionId et poolAddress)
  const positionBalances = dexBalances.filter(
    (b) => (b as any).positionId === positionId && b.poolAddress === poolAddress
  );

  // Vérifier si au moins un token a une balance à zéro
  return positionBalances.some((b) => {
    const balance = new BigNumber(b.tokenBalance);
    return balance.isZero();
  });
}

/**
 * Modifie les balances des DEX en fonction des options spécifiées
 * @param data Données d'entrée de type SourceBalancesREG[]
 * @param options Options de boost des balances des DEX
 * Les options sont de type { [key in DexValue]?: [string[], number[]] }
 * string[] est un tableau de symboles de tokens à booster ou '*' pour tous les tokens
 * number[] est un tableau de facteurs de boost correspondants
 * @returns Données modifiées de type SourceBalancesREG[]
 */
export function boosBalancesDexs(
  data: SourceBalancesREG[],
  options: NormalizeOptions["boosBalancesDexs"]
): SourceBalancesREG[] {
  console.info(i18n.t("modifiers.infoApplyModifier", { modifier: "boosBalancesDexs" }), options);

  // Si aucune option de boost n'est fournie, retourner les données inchangées
  if (!options || Object.keys(options).length === 0) {
    return data;
  }

  // Parcourir chaque utilisateur
  return data.map((user) => {
    // Parcourir chaque réseau dans les balances de l'utilisateur
    for (const network in user.sourceBalance) {
      const dexs = user.sourceBalance[network as Network]?.dexs;
      if (!dexs || Object.keys(dexs).length === 0) continue;

      // Parcourir chaque DEX dans le réseau
      for (const dex in dexs) {
        const dexOptions = options[dex as DexValue];
        if (!dexs[dex as DexValue]?.length || !dexOptions) continue;

        const [tokensToApply, boostFactors] = dexOptions;
        const dexBalances = dexs[dex as DexValue]!;

        // Appliquer le boost à chaque balance du DEX
        dexBalances.forEach((balance) => {
          const symbolIndex = tokensToApply.includes(balance.tokenSymbol)
            ? tokensToApply.indexOf(balance.tokenSymbol)
            : tokensToApply.indexOf("*");

          if (symbolIndex >= 0) {
            // Vérifier si la position est V3 (avec positionID) et a un token à zéro,
            // Si c'est le cas, la position est hors range et aucun boost ne sera appliqué
            const positionId = (balance as any).positionId;
            const hasZeroToken =
              positionId !== undefined &&
              hasZeroTokenInPosition(dexBalances, positionId, balance.poolAddress);

            // Si position hors range
            if (hasZeroToken) {
              // Pas de boost appliqué - balance.equivalentREG reste inchangé
              console.log(
                `Position ${positionId}: token ${balance.tokenSymbol} sans boost (autre token à zéro dans le pool ${balance.poolAddress})`
              );
            } else {
              // Appliquer le boost normalement
              const networkMaj = network.charAt(0).toUpperCase() + network.slice(1);
              const newBalance = new BigNumber(balance.equivalentREG)
                .multipliedBy(boostFactors[symbolIndex])
                .toString(10);
              const oldEquivalentREG = balance.equivalentREG;
              balance.equivalentREG = newBalance;

              // Mettre à jour les totaux
              const totalBalanceKey = balance.tokenSymbol === "REG" ? "totalBalanceREG" : "totalBalanceEquivalentREG";
              const totalBalanceKeyNetwork =
                balance.tokenSymbol === "REG" ? `totalBalanceReg${networkMaj}` : `totalBalanceEquivalentReg${networkMaj}`;

              user[totalBalanceKey] = new BigNumber(user[totalBalanceKey])
                .minus(oldEquivalentREG)
                .plus(newBalance)
                .toString(10);
              user[totalBalanceKeyNetwork] = new BigNumber(user[totalBalanceKeyNetwork])
                .minus(oldEquivalentREG)
                .plus(newBalance)
                .toString(10);
              user.totalBalance = new BigNumber(user.totalBalance).minus(oldEquivalentREG).plus(newBalance).toString(10);
            }
          }
        });
      }
    }

    return user;
  });
}

export function boosBalancesDexs(
  data: SourceBalancesREG[],
  options: NormalizeOptions["boosBalancesDexs"]
): SourceBalancesREG[] {
  console.info(i18n.t("modifiers.infoApplyModifier", { modifier: "boosBalancesDexs" }), options);

  // Si aucune option de boost n'est fournie, retourner les données inchangées
  if (!options || Object.keys(options).length === 0) {
    return data;
  }

  // Parcourir chaque utilisateur
  return data.map((user) => {
    // Parcourir chaque réseau dans les balances de l'utilisateur
    for (const network in user.sourceBalance) {
      const dexs = user.sourceBalance[network as Network]?.dexs;
      if (!dexs || Object.keys(dexs).length === 0) continue;

      // Parcourir chaque DEX dans le réseau
      for (const dex in dexs) {
        const dexOptions = options[dex as DexValue];
        if (!dexs[dex as DexValue]?.length || !dexOptions) continue;

        const [tokensToApply, boostFactors] = dexOptions;
        const dexBalances = dexs[dex as DexValue]!;

        // Appliquer le boost à chaque balance du DEX
        dexBalances.forEach((balance) => {
          const symbolIndex = tokensToApply.includes(balance.tokenSymbol)
            ? tokensToApply.indexOf(balance.tokenSymbol)
            : tokensToApply.indexOf("*");

          if (symbolIndex >= 0) {
            // Vérifier si la position est V3 (avec positionID) et a un token à zéro,
            // Si c'est le cas, la position est hors range et aucun boost ne sera appliqué
            const positionId = (balance as any).positionId;
            const hasZeroToken =
              positionId !== undefined &&
              hasZeroTokenInPosition(dexBalances, positionId, balance.poolAddress);

            // Si position hors range
            if (hasZeroToken) {
              // Pas de boost appliqué - balance.equivalentREG reste inchangé
              console.log(
                `Position ${positionId}: token ${balance.tokenSymbol} sans boost (autre token à zéro dans le pool ${balance.poolAddress})`
              );
            } else {
              // Appliquer le boost normalement
            const networkMaj = network.charAt(0).toUpperCase() + network.slice(1);
            const newBalance = new BigNumber(balance.equivalentREG)
              .multipliedBy(boostFactors[symbolIndex])
              .toString(10);
            const oldEquivalentREG = balance.equivalentREG;
            balance.equivalentREG = newBalance;

            // Mettre à jour les totaux
            const totalBalanceKey = balance.tokenSymbol === "REG" ? "totalBalanceREG" : "totalBalanceEquivalentREG";
            const totalBalanceKeyNetwork =
              balance.tokenSymbol === "REG" ? `totalBalanceReg${networkMaj}` : `totalBalanceEquivalentReg${networkMaj}`;

            user[totalBalanceKey] = new BigNumber(user[totalBalanceKey])
              .minus(oldEquivalentREG)
              .plus(newBalance)
              .toString(10);
            user[totalBalanceKeyNetwork] = new BigNumber(user[totalBalanceKeyNetwork])
              .minus(oldEquivalentREG)
              .plus(newBalance)
              .toString(10);
            user.totalBalance = new BigNumber(user.totalBalance).minus(oldEquivalentREG).plus(newBalance).toString(10);
          }
          }
        });
      }
    }

    return user;
  });
}

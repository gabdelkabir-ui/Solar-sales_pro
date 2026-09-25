import { TVA_RATE, CURRENCY } from '../constants/config';

/** Une ligne de produit d'un rapport */
export interface LineItem {
  reference: string;
  designation: string;
  quantity: number;
  unitPrice: number;
  totalHT: number;
}

/** Synthèse calculée des totaux d'un rapport */
export interface Totals {
  totalHT: number;
  discount: number;
  afterDiscountHT: number;
  shipping: number;
  taxable: number;
  tva: number;
  totalTTC: number;
}

/** Arrondi monétaire à 2 décimales */
export const round2 = (value: number): number => Math.round(value * 100) / 100;

export interface TotalsOptions {
  /** Remise (HT) appliquée à la commande */
  discount?: number;
  /** Frais de livraison (HT) */
  shipping?: number;
}

/**
 * Calcule les totaux d'un devis / bon de commande.
 * Base TVA = Total HT - Remise + Frais de livraison.
 */
export function computeTotals(lineItems: LineItem[], opts: TotalsOptions = {}): Totals {
  const totalHT = round2(lineItems.reduce((sum, item) => sum + (item.totalHT || 0), 0));
  const discount = round2(Math.max(0, opts.discount || 0));
  const afterDiscountHT = round2(totalHT - discount);
  const shipping = round2(Math.max(0, opts.shipping || 0));
  const taxable = round2(afterDiscountHT + shipping);
  const tva = round2(taxable * TVA_RATE);
  const totalTTC = round2(taxable + tva);
  return { totalHT, discount, afterDiscountHT, shipping, taxable, tva, totalTTC };
}

/** Formate un montant en devise française */
export const formatPrice = (price: number | null | undefined): string =>
  price === null || price === undefined
    ? '-'
    : `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)} ${CURRENCY}`;
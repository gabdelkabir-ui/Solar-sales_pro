import {
  CgvContext,
  CgvClause,
  CATEGORY_POLICIES,
  DEFAULT_CATEGORY_POLICY,
} from '../constants/cgv';
import { COMPANY, CURRENCY, TVA_RATE } from '../constants/config';
import { formatPrice } from './pricing';

/** Récupère la politique (garantie/délai) d'une catégorie */
function policyFor(category: string) {
  return CATEGORY_POLICIES[category] || DEFAULT_CATEGORY_POLICY;
}

/**
 * Construit les clauses des CGV à partir d'un contexte métier.
 * Le texte est généré à la volée : les montants, la date de paiement,
 * la garantie et le délai de livraison dépendent du client et des produits.
 */
export function buildCgv(ctx: CgvContext): CgvClause[] {
  const { totals } = ctx;
  const company = COMPANY.name;
  const lines: string[] = [];

  // --- Montants du devis / bon de commande ---
  const amounts: string[] = [
    `Les prix sont exprimés en ${CURRENCY}, nets, hors taxe, sur la base des tarifs communiqués à l'acheteur. `,
    `Total hors taxe : ${formatPrice(totals.totalHT)}.`,
  ];
  if (totals.discount > 0) {
    amounts.push(`Remise accordée : ${formatPrice(totals.discount)}.`);
  }
  amounts.push(`Total HT après remise : ${formatPrice(totals.afterDiscountHT)}.`);
  if (totals.shipping > 0) {
    amounts.push(`Frais de livraison : ${formatPrice(totals.shipping)}.`);
  }
  amounts.push(`TVA (${(TVA_RATE * 100).toFixed(0)}%) : ${formatPrice(totals.tva)}.`);
  amounts.push(`Total TTC à payer : ${formatPrice(totals.totalTTC)}.`);
  amounts.push(
    `Le montant total de la présente commande s'élève à ${formatPrice(totals.totalTTC)} et sera facturé à ${ctx.customerLabel}.`
  );
  lines.push(amounts.join(' '));

  // --- Paiement ---
  lines.push(
    `Le règlement interviendra à la date de paiement indiquée, soit le ${ctx.paymentDateLabel}. ` +
    `Le numéro de la commande est ${ctx.orderNumber}. ` +
    'En l\'absence d\'accord préalable sur les délais de paiement, celui-ci ne peut dépasser 60 jours à compter de la date de facturation, conformément aux lois en vigueur. ' +
    'Aucun escompte ne sera consenti en cas de paiement anticipé. ' +
    'En cas de retard de paiement, des pénalités sont applicables conformément à l\'article L441-10 du Code de commerce.'
  );

  // --- Produits / catégories : garantie & délai ---
  if (ctx.productCount > 0) {
    const categoryLines = ctx.productCategories.length > 0
      ? ctx.productCategories.map(
          (c) => `${c} : garantie ${policyFor(c).warranty}, livraison ${policyFor(c).delivery}.`
        )
      : [`Garantie : ${DEFAULT_CATEGORY_POLICY.warranty}.`];
    lines.push(
      'Garantie et livraison par catégorie de produit : ' +
        categoryLines.join(' ') +
        ' La société ' +
        company +
        " s'engage à remédier à tout défaut de fonctionnement provenant d'un vice de conception, de matière ou de fabrication."
    );
  }

  // --- Délai et réception de livraison ---
  lines.push(
    `Les délais de livraison annoncés sont indicatifs et commencent à courir à compter de la réception de la commande confirmée. ` +
    'Si la livraison est effectuée par le vendeur, un bon de livraison est dressé à la livraison et doit porter la signature et le cachet de l\'acheteur ; ' +
    'la signature apposée entraîne l\'acceptation de la livraison sans réserve quant à la quantité, la qualité et la conformité de la marchandise.'
  );

  // --- Dispositions générales (force majeure, réserve de propriété, litiges) ---
  lines.push(
    `La responsabilité de ${company} ne pourra pas être engagée si la non-exécution ou le retard découle d'un cas de force majeure. ` +
    `${company} conserve la propriété des biens vendus jusqu'au paiement intégral du prix, en principal et en accessoires. ` +
    `Les présentes ventes sont soumises aux CGV de ${company} sans réserve, réputées acceptées par l'acheteur du seul fait de sa commande. ` +
    `En cas de litige non résolu à l'amiable ni par médiation, la compétence exclusive appartient aux tribunaux de ${COMPANY.courts}, France.`
  );

  return [{
    paragraphs: lines,
  }];
}

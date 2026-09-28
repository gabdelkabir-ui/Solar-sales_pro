import {
  CgvContext,
  CgvClause,
  CGV_WORD_PARAGRAPHS,
} from '../constants/cgv';

/**
 * Construit les clauses des CGV à partir d'un contexte métier.
 * Le texte est généré à la volée : les montants, la date de paiement,
 * la garantie et le délai de livraison dépendent du client et des produits.
 */
export function buildCgv(ctx: CgvContext): CgvClause[] {
  // Le document Word fourni sert de référence contractuelle. Les paramètres du
  // contexte restent disponibles pour de futures variantes, mais les CGV ne
  // doivent pas réécrire les montants/date/produits déjà dynamiques en page 1.
  void ctx;
  return [{
    paragraphs: CGV_WORD_PARAGRAPHS,
  }];
}

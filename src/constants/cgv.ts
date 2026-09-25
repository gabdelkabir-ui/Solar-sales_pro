import { Totals } from '../utils/pricing';

/**
 * Contexte passé au constructeur des CGV.
 * Permet d'injecter les données du client, des produits et des totaux dans le texte.
 */
export interface CgvContext {
  /** Nom affiché du client (Nom + Prénom si présent) */
  customerLabel: string;
  orderNumber: string;
  /** Date de paiement formatée (dd/MM/yyyy) */
  paymentDateLabel: string;
  totals: Totals;
  /** Catégories de produits présentes dans la commande (dédupliquées) */
  productCategories: string[];
  productCount: number;
}

export interface CgvClause {
  /** Titre facultatif de la clause */
  title?: string;
  /** Paragraphes de la clause */
  paragraphs: string[];
}

/** Politique garantie / délai par catégorie de produit (extensible) */
export interface ProductCategoryPolicy {
  warranty: string;
  delivery: string;
}

export const CATEGORY_POLICIES: Record<string, ProductCategoryPolicy> = {
  panel: { warranty: '10 ans matériel (garantie fabricant)', delivery: '5 à 8 jours ouvrés' },
  battery: { warranty: '5 ans (garantie fabricant)', delivery: '5 à 8 jours ouvrés' },
  inverter: { warranty: '5 ans (garantie fabricant)', delivery: '3 à 5 jours ouvrés' },
  other: { warranty: 'selon la fiche produit', delivery: '2 à 4 jours ouvrés' },
};

export const DEFAULT_CATEGORY_POLICY: ProductCategoryPolicy = {
  warranty: 'selon la fiche produit fournie',
  delivery: '2 à 8 jours ouvrés',
};

export const CGV_TITLE = 'CONDITIONS GENERALES DE VENTE';
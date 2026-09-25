import { ReportType } from '../types';

/**
 * Types de documents générés dans les rapports.
 * Une seule source de vérité pour les libellés (remplace les ternaires 'facture' en dur).
 */
export interface ReportTypeConfig {
  /** Titre affiché sur la page 1 */
  title: string;
  /** Libellé du bouton d'impression */
  printLabel: string;
  /** Préfixe du nom de fichier PDF/export */
  fileNamePrefix: string;
  /** Afficher le bloc « conditions de paiement » */
  hasPaymentConditions: boolean;
  /** Afficher la ligne de signature client */
  hasClientSignature: boolean;
}

export const REPORT_TYPES: Record<ReportType, ReportTypeConfig> = {
  devis: {
    title: 'DEVIS',
    printLabel: 'Imprimer le devis',
    fileNamePrefix: 'Devis_',
    hasPaymentConditions: true,
    hasClientSignature: true,
  },
  'bon-de-commande': {
    title: 'BON DE COMMANDE',
    printLabel: 'Imprimer le bon de commande',
    fileNamePrefix: 'Bon_de_commande_',
    hasPaymentConditions: true,
    hasClientSignature: true,
  },
};
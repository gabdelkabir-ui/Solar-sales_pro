/**
 * Configuration globale : société, TVA, devise.
 * Une seule source de vérité (actuellement ces valeurs sont dupliquées dans les rapports).
 */
export const TVA_RATE = 0.2;

export const CURRENCY = '€';

export const COMPANY = {
  name: 'EASY POWER',
  legalForm: 'SAS',
  legalFormShort: 'EASY POWER SASU',
  address: '31 Rue des Martres de Madargue',
  postalCity: '63200, RIOM, FRANCE',
  rcs: 'Clermont-Ferrand',
  siret: '93183542500014',
  email: 'commercial@easypower-france.fr',
  technicalPhone: '+33 6 72 07 97 27',
  commercialPhone: '+33 1 78 76 68 19',
  courts: 'Clermont-Ferrand',
};

/** Nombre de jours ajoutés à la date du jour pour la date de paiement par défaut */
export const DEFAULT_PAYMENT_DELAY_DAYS = 30;
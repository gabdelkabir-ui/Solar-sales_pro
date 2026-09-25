import { CustomerFieldDef } from '../types';

/**
 * Registre extensible des champs client.
 * Toute la plateforme (formulaire, import Excel, Devis, Bon de commande) utilise ce fichier.
 * Pour ajouter un champ : ajoutez une entrée ici. La clé doit exister dans CustomerInfo
 * (les champs hors des colonnes SQL dédiées seront stockés en JSON côté backend).
 */
export const CUSTOMER_FIELDS: CustomerFieldDef[] = [
  { key: 'name', label: 'Nom / Raison sociale', printLabel: 'Nom / Raison sociale' },
  { key: 'firstName', label: 'Prénom', printLabel: 'Prénom' },
  { key: 'dirigeants', label: 'Dirigeant(s)', printLabel: 'Dirigeant(s)' },
  { key: 'creation', label: 'Création', printLabel: 'Création' },
  { key: 'address', label: 'Adresse', printLabel: 'Adresse', multiline: true },
  { key: 'postalCode', label: 'Code postal', printLabel: 'Code postal' },
  { key: 'city', label: 'Ville / Localisation', printLabel: 'Ville' },
  { key: 'phone', label: 'Numéro de téléphone', printLabel: 'Téléphone' },
  { key: 'email', label: 'E-mail', printLabel: 'E-mail' },
  { key: 'chiffreAffaires', label: "Chiffre d'affaires", printLabel: "Chiffre d'affaires" },
  { key: 'resultatNet', label: 'Résultat net', printLabel: 'Résultat net' },
  { key: 'effectif', label: 'Effectif', printLabel: 'Effectif' },
  { key: 'notes', label: 'Notes', printLabel: 'Notes', multiline: true },
];

/** Champs SQL dédiés (colonnes persistées) dans la table Clients */
export const CORE_CLIENT_FIELDS = ['name', 'phone', 'city', 'notes'];

/** Placeholder par défaut quand une valeur client est absente dans un rapport */
export const DEFAULT_EMPTY_PLACEHOLDER = '?';

/** Placeholder « ligne » utilisé pour les zones de saisie manuscrite */
export const DEFAULT_LINE_PLACEHOLDER = '____________________';

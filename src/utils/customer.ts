import { CustomerInfo } from '../types';
import { CUSTOMER_FIELDS, CORE_CLIENT_FIELDS, DEFAULT_EMPTY_PLACEHOLDER } from '../constants/customerFields';

/** Normalise un nom de colonne Excel en clé stable utilisable par JSON/React. */
export function normalizeCustomerKey(label: string, index = 0): string {
  const normalized = String(label || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+(.)/g, (_m, char) => String(char).toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^[0-9]+/, 'field');
  return normalized || `customField${index + 1}`;
}

/** Détection souple des champs standards, sans imposer le schéma de l'Excel. */
export function inferCustomerField(header: string, index = 0): string {
  const h = String(header || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/^(nom|raison sociale|raison social|entreprise|entreprises|societe|company|client)$/.test(h) || /nom.*(entreprise|societe)/.test(h) || /raison.*social/.test(h)) return 'name';
  if (/prenom|first.?name/.test(h)) return 'firstName';
  if (/telephone|tel|mobile|gsm|phone|coordonnees|coordonnee/.test(h)) return 'phone';
  if (/e.?mail|courriel|mail/.test(h)) return 'email';
  if (/adresse|address|siege/.test(h)) return 'address';
  if (/code.?postal|postal.?code|zip/.test(h)) return 'postalCode';
  if (/ville|city|localisation|commune|region|departement/.test(h)) return 'city';
  if (/dirigeant|dirigeants|manager|gerant|president|responsable/.test(h)) return 'dirigeants';
  if (/creation|date.*creation|annee.*creation/.test(h)) return 'creation';
  if (/chiffre.*affaire|ca.*moyen|revenu|chiffreaffaires/.test(h)) return 'chiffreAffaires';
  if (/resultat.*net|resultatnet|benefice|perte/.test(h)) return 'resultatNet';
  if (/effectif|salarie|employe|nombre.*personne/.test(h)) return 'effectif';
  if (/cin|identite|piece/.test(h)) return 'skip';
  if (/note|commentaire|observation/.test(h)) return 'notes';
  return normalizeCustomerKey(header, index);
}

/** Crée un client vide sur la base des champs connus */
export function createEmptyCustomer(): CustomerInfo {
  const customer: CustomerInfo = { name: '', phone: '', city: '', notes: '' };
  CUSTOMER_FIELDS.forEach((f) => {
    customer[f.key] = '';
  });
  return customer;
}

/** Teste si un champ est « vide » (indépendamment du type réel) */
export function isEmptyFieldValue(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

/** Récupère le texte d'affichage d'un champ avec placeholder si absent */
export function displayFieldValue(customer: CustomerInfo | null | undefined, key: string): string {
  if (!customer) return DEFAULT_EMPTY_PLACEHOLDER;
  const value = customer[key];
  return isEmptyFieldValue(value) ? DEFAULT_EMPTY_PLACEHOLDER : String(value);
}

/** Champs personnalisés réellement importés, avec leur libellé Excel d'origine. */
export function getCustomCustomerFields(customer: CustomerInfo | null | undefined) {
  if (!customer) return [] as Array<{ key: string; label: string }>;
  const labels = customer._fieldLabels || {};
  const standard = new Set(CUSTOMER_FIELDS.map((f) => f.key));
  return Object.keys(customer)
    .filter((key) => !standard.has(key) && !key.startsWith('_') && key !== 'id' && key !== 'cin')
    .map((key) => ({ key, label: labels[key] || key }));
}

/** Séparateur pour la dénomination des produits dans les rapports */
export const PRODUCT_SEPARATOR = ' - ';

export { CUSTOMER_FIELDS, CORE_CLIENT_FIELDS };

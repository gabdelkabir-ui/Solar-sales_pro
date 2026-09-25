export interface Equipment {
  id: string;
  name: string;
  defaultPower: number; // Watts
  icon: string;
  category: string;
  subCategory: string;
}

export interface SelectedEquipment extends Equipment {
  instanceId: string;
  quantity: number;
  power: number;
  hoursPerDay: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  city: string;
  notes: string;
  firstName?: string;
  address?: string;
  postalCode?: string;
  email?: string;
  // Permet d'étendre facilement la liste des champs via customerFields.ts
  [key: string]: any;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  city: string;
  notes: string;
  firstName?: string;
  address?: string;
  postalCode?: string;
  email?: string;
  [key: string]: any;
}

/**
 * Définition d'un champ client configurable.
 * Utilisée par le formulaire, l'import Excel et l'affichage dans les rapports.
 */
export interface CustomerFieldDef {
  /** Clé dans CustomerInfo (ex: 'firstName') */
  key: string;
  /** Libellé affiché dans le formulaire */
  label: string;
  /** Libellé affiché dans le rapport (Devis / Bon de commande) */
  printLabel: string;
  required?: boolean;
  /** Texte affiché quand la valeur est absente (ex: '?') */
  placeholder?: string;
  /** Saisie multiligne (ex: Notes) */
  multiline?: boolean;
}

/** Type de document généré dans les rapports */
export type ReportType = 'bon-de-commande' | 'devis';

export interface SolarSystemRecommendation {
  panelPower: number;
  panelCount: number;
  panelModel: string;
  batteryCapacity: number;
  batteryModel: string;
  autonomyDays: number;
  inverterPower: number;
  inverterModel: string;
}

export interface ProjectData {
  customer: CustomerInfo;
  equipment: SelectedEquipment[];
  orderNumber?: string;
  paymentDate?: string;
  energySimulation?: EnergySimulation;
}

export interface ColumnMapping {
  excelColumn: string;
  field: string; // clé de CustomerFieldDef ou 'skip'
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  // Catégorie extensible : les anciennes valeurs restent compatibles avec
  // les produits déjà enregistrés en base.
  category: string;
  brand: string;
  capacityWh: number | null;
  outputPowerW: number | null;
  expandable: boolean;
  description: string | null;
  keyFeatures: string[] | null;
  priceMad: number | null;
  url: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRecommendation {
  panel: Product;
  battery: Product;
  inverter?: Product;
  panelCount: number;
  panelPower: number;
  batteryCapacity: number;
  autonomyDays: number;
  inverterPower?: number;
  totalPriceMad: number;
}

export interface EnergySimulation {
  // Étape 1 - Saisie facture
  factureMensuelle: string;
  typeContrat: 'HP/HC' | 'Base' | 'Tempo' | 'EJP';
  consommationHP: string;
  consommationHC: string;
  tarifHP: string;
  tarifHC: string;
  presencePanneaux: boolean;

  // Sélection des produits depuis la base de données
  selectedBatteryId?: number | null;
  selectedPanelId?: number | null;

  // Résultats calculés (étapes 2-7)
  totalConsommation?: number;
  pourcentageHP?: number;
  pourcentageHC?: number;
  ecartTarifaire?: number;
  potentielOptimisation?: 'Faible' | 'Moyen' | 'Important';
  energieDeplacee?: number;
  consoApresHp?: number;
  consoApresHc?: number;
  economieQuotidienne?: number;
  economieMensuelle?: number;
  economieAnnuelle?: number;
  prixBalco?: number;
  roi?: number;
  conclusion?: string;
}

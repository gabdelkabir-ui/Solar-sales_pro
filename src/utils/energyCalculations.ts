import { Product } from '../types';

// Caractéristiques techniques par défaut (fallback si aucun produit sélectionné)
export const DEFAULT_BALCO_SPECS = {
  capacityWh: 2560,
  outputPowerW: 1200,
  bidirectionalInverterW: 1200,
  roundTripEfficiency: 0.90, // 90% rendement aller-retour
  solarInputW: 2400,
  priceMad: 874.17, // Prix public
  maxDailyShiftKwh: 2.56, // Capacité utile par cycle
};

// Heures d'ensoleillement équivalentes par défaut
const DEFAULT_SUN_HOURS = 4.5;

// Calcul du tarif moyen pondéré
function calculerTarifMoyen(consommationHP: number, consommationHC: number, tarifHP: number, tarifHC: number): number {
  const total = consommationHP + consommationHC;
  if (total === 0) return 0;
  return (consommationHP * tarifHP + consommationHC * tarifHC) / total;
}

// Calcul de l'écart tarifaire HP/HC
export function calculerEcartTarifaire(tarifHP: number, tarifHC: number): number {
  return tarifHP - tarifHC;
}

// Calcul de la répartition en pourcentage
export function calculerRepartition(consommationHP: number, consommationHC: number): { pourcentageHP: number; pourcentageHC: number; total: number } {
  const total = consommationHP + consommationHC;
  if (total === 0) return { pourcentageHP: 0, pourcentageHC: 0, total: 0 };
  return {
    pourcentageHP: Math.round((consommationHP / total) * 100),
    pourcentageHC: Math.round((consommationHC / total) * 100),
    total,
  };
}

// Détermination du potentiel d'optimisation
export function determinerPotentiel(pourcentageHP: number): 'Faible' | 'Moyen' | 'Important' {
  if (pourcentageHP >= 70) return 'Important';
  if (pourcentageHP >= 50) return 'Moyen';
  return 'Faible';
}

// Récupération des specs batterie (depuis le produit ou fallback)
function getBatterySpecs(battery?: Product | null) {
  if (battery && battery.capacityWh) {
    return {
      capacityWh: battery.capacityWh,
      outputPowerW: battery.outputPowerW || DEFAULT_BALCO_SPECS.outputPowerW,
      roundTripEfficiency: DEFAULT_BALCO_SPECS.roundTripEfficiency,
      priceMad: battery.priceMad || DEFAULT_BALCO_SPECS.priceMad,
      maxDailyShiftKwh: (battery.capacityWh / 1000) * DEFAULT_BALCO_SPECS.roundTripEfficiency,
    };
  }
  return DEFAULT_BALCO_SPECS;
}

// Calcul de la capacité solaire journalière estimée
function getSolaireQuotidienKwh(panel?: Product | null): number {
  if (panel && panel.outputPowerW) {
    // kWh utiles par jour = puissance panneau * heures ensoleillement * rendement / 1000
    return (panel.outputPowerW * DEFAULT_SUN_HOURS * DEFAULT_BALCO_SPECS.roundTripEfficiency) / 1000;
  }
  // Fallback: 2.3 kWh/jour (valeur par défaut)
  return 2.3;
}

// Calcul de l'énergie pouvant être déplacée par mois avec la batterie
export function calculerEnergieDeplacee(
  consommationHP: number,
  consommationHC: number,
  typeContrat: 'HP/HC' | 'Base' | 'Tempo' | 'EJP',
  presencePanneaux: boolean,
  battery?: Product | null,
  panel?: Product | null
): number {
  const batterySpecs = getBatterySpecs(battery);

  if (presencePanneaux) {
    // AVEC panneaux PV : la batterie stocke l'énergie solaire excédentaire
    const solaireQuotidien = getSolaireQuotidienKwh(panel);
    const maxSolaireParMois = solaireQuotidien * 30;

    // On ne peut pas stocker plus que la consommation totale
    const totalConso = consommationHP + consommationHC;
    const stockable = Math.min(maxSolaireParMois, totalConso * 0.5); // max 50% de la conso totale

    return Math.round(stockable);
  }

  // SANS panneaux PV : la batterie déplace de la consommation HP vers HC
  if (typeContrat !== 'HP/HC') {
    // Pour les autres types de contrat, on estime le potentiel différemment
    return Math.round((consommationHP + consommationHC) * 0.15);
  }

  // Pour HP/HC : la batterie peut déplacer jusqu'à sa capacité par jour de HP vers HC
  // Sur un mois (30 jours), capacité max = maxDailyShiftKwh * 30
  const maxDeplacableParMois = batterySpecs.maxDailyShiftKwh * 30;

  // On ne peut pas déplacer plus que la consommation HP
  const deplacable = Math.min(maxDeplacableParMois, consommationHP * 0.7); // max 70% de la conso HP

  return Math.round(deplacable);
}

// Calcul de l'économie mensuelle
export function calculerEconomieMensuelle(
  energieDeplacee: number,
  tarifHP: number,
  tarifHC: number,
  presencePanneaux: boolean
): number {
  if (presencePanneaux) {
    // AVEC panneaux PV : économie = énergie solaire stockée × tarif HP complet
    // Car l'énergie solaire remplace de l'électricité qui aurait été achetée en HP
    return Math.round(energieDeplacee * tarifHP * 100) / 100;
  }

  // SANS panneaux PV : économie = énergie déplacée × écart tarifaire (HP - HC)
  const ecart = tarifHP - tarifHC;
  return Math.round(energieDeplacee * ecart * 100) / 100;
}

// Calcul de l'économie annuelle
export function calculerEconomieAnnuelle(economieMensuelle: number): number {
  return Math.round(economieMensuelle * 12 * 100) / 100;
}

// Calcul de l'économie quotidienne
export function calculerEconomieQuotidienne(economieMensuelle: number): number {
  return Math.round((economieMensuelle / 30) * 100) / 100;
}

// Calcul du retour sur investissement (ROI) en années
export function calculerROI(prixBalco: number, economieAnnuelle: number): number {
  if (economieAnnuelle <= 0) return 0;
  return Math.round((prixBalco / economieAnnuelle) * 10) / 10;
}

// Simulation après batterie (consommation après optimisation)
export function calculerApresBalco(
  consommationHP: number,
  consommationHC: number,
  energieDeplacee: number
): { consoApresHp: number; consoApresHc: number } {
  return {
    consoApresHp: Math.max(0, Math.round((consommationHP - energieDeplacee) * 10) / 10),
    consoApresHc: Math.round((consommationHC + energieDeplacee) * 10) / 10,
  };
}

// Génération de la conclusion automatique
export function genererConclusion(
  economieMensuelle: number,
  pourcentageHP: number,
  presencePanneaux: boolean,
  roi: number
): string {
  let conclusion = '';

  if (economieMensuelle <= 0) {
    conclusion = "Votre consommation est déjà bien répartie. La batterie pourrait néanmoins vous apporter une indépendance énergétique et une protection contre les hausses futures des tarifs.";
  } else if (economieMensuelle < 10) {
    conclusion = `Grâce à la batterie, vous réalisez une économie modeste mais régulière.`;
  } else if (economieMensuelle < 30) {
    conclusion = `Avec la batterie, vous économisez environ ${economieMensuelle.toFixed(0)} € par mois sur votre facture d'électricité.`;
  } else {
    conclusion = `La batterie vous permet de réduire significativement votre facture d'électricité d'environ ${economieMensuelle.toFixed(0)} € par mois !`;
  }

  if (pourcentageHP > 60) {
    conclusion += ` Votre consommation en Heures Pleines représente ${pourcentageHP}% du total, ce qui est idéal pour maximiser les économies avec la batterie.`;
  }

  if (presencePanneaux) {
    conclusion += ` Avec vos panneaux photovoltaïques, la batterie peut stocker votre production solaire pour une utilisation en soirée, augmentant encore votre autoconsommation.`;
  }

  if (roi > 0 && roi < 10) {
    conclusion += ` Le retour sur investissement est estimé à ${roi} an${roi > 1 ? 's' : ''}.`;
  }

  return conclusion;
}

// Interface des résultats de simulation
export interface SimulationResults {
  totalConsommation: number;
  pourcentageHP: number;
  pourcentageHC: number;
  ecartTarifaire: number;
  potentielOptimisation: 'Faible' | 'Moyen' | 'Important';
  energieDeplacee: number;
  consoApresHp: number;
  consoApresHc: number;
  economieQuotidienne: number;
  economieMensuelle: number;
  economieAnnuelle: number;
  prixBalco: number;
  roi: number;
  conclusion: string;
  // Informations sur les produits sélectionnés
  batteryName?: string;
  panelName?: string;
  batteryCapacity?: number;
  panelPower?: number;
}

// Fonction principale d'exécution de la simulation complète
export function executerSimulation(params: {
  factureMensuelle: string;
  typeContrat: 'HP/HC' | 'Base' | 'Tempo' | 'EJP';
  consommationHP: string;
  consommationHC: string;
  tarifHP: string;
  tarifHC: string;
  presencePanneaux: boolean;
  selectedBattery?: Product | null;
  selectedPanel?: Product | null;
}): SimulationResults {
  const consoHP = parseFloat(params.consommationHP) || 0;
  const consoHC = parseFloat(params.consommationHC) || 0;
  const tHP = parseFloat(params.tarifHP) || 0;
  const tHC = parseFloat(params.tarifHC) || 0;
  const battery = params.selectedBattery;
  const panel = params.selectedPanel;
  const batterySpecs = getBatterySpecs(battery);

  const { pourcentageHP, pourcentageHC, total } = calculerRepartition(consoHP, consoHC);
  const ecartTarifaire = calculerEcartTarifaire(tHP, tHC);
  const potentiel = determinerPotentiel(pourcentageHP);
  const energieDeplacee = calculerEnergieDeplacee(consoHP, consoHC, params.typeContrat, params.presencePanneaux, battery, panel);
  const apres = calculerApresBalco(consoHP, consoHC, energieDeplacee);
  const economieMensuelle = calculerEconomieMensuelle(energieDeplacee, tHP, tHC, params.presencePanneaux);
  const economieAnnuelle = calculerEconomieAnnuelle(economieMensuelle);
  const economieQuotidienne = calculerEconomieQuotidienne(economieMensuelle);
  const prixBalco = batterySpecs.priceMad;
  const roi = calculerROI(prixBalco, economieAnnuelle);
  const conclusion = genererConclusion(economieMensuelle, pourcentageHP, params.presencePanneaux, roi);

  return {
    totalConsommation: total,
    pourcentageHP,
    pourcentageHC,
    ecartTarifaire,
    potentielOptimisation: potentiel,
    energieDeplacee,
    consoApresHp: apres.consoApresHp,
    consoApresHc: apres.consoApresHc,
    economieQuotidienne,
    economieMensuelle,
    economieAnnuelle,
    prixBalco,
    roi,
    conclusion,
    batteryName: battery?.name,
    panelName: panel?.name,
    batteryCapacity: battery?.capacityWh || undefined,
    panelPower: panel?.outputPowerW || undefined,
  };
}
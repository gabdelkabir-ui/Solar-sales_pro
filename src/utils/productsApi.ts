import { Product, ProductRecommendation } from '../types';
import { PRODUCT_CATALOG } from '../constants/products';

/**
 * Get all products (from static catalog).
 */
export async function fetchProducts(category?: string): Promise<Product[]> {
  if (category) {
    return PRODUCT_CATALOG.filter(p => p.category === category && p.isActive);
  }
  return PRODUCT_CATALOG.filter(p => p.isActive);
}

/**
 * Get all products (cached sync version).
 */
export async function fetchAllProducts(): Promise<Product[]> {
  return PRODUCT_CATALOG.filter(p => p.isActive);
}

/**
 * Seed is a no-op for static data, but kept for API compatibility.
 */
export async function seedProducts(): Promise<boolean> {
  return true;
}

/**
 * Given daily consumption and peak power, selects the best matching products
 * from the static catalog and returns a ProductRecommendation.
 */
export async function getRecommendationFromProducts(
  dailyKWh: number,
  peakPower: number
): Promise<ProductRecommendation | null> {
  const allProducts = PRODUCT_CATALOG.filter(p => p.isActive);

  const panels = allProducts.filter(p => p.category === 'panel' && p.outputPowerW);
  const batteries = allProducts.filter(p => p.category === 'battery' && p.capacityWh);
  const inverters = allProducts.filter(p => p.category === 'inverter' && p.outputPowerW);

  if (panels.length === 0 || batteries.length === 0 || inverters.length === 0) {
    return null;
  }

  // ---- Panel selection ----
  const sunHours = 4.5;
  const requiredPanelPower = (dailyKWh * 1.2 * 1000) / sunHours; // in Watts
  let bestPanel: Product = panels[0];
  let bestPanelCount = 1;
  let bestPanelDiff = Infinity;

  for (const panel of panels) {
    const pw = panel.outputPowerW!;
    for (let count = 1; count <= 20; count++) {
      const totalPower = count * pw;
      const diff = Math.abs(totalPower - requiredPanelPower);
      if (diff < bestPanelDiff) {
        bestPanelDiff = diff;
        bestPanel = panel;
        bestPanelCount = count;
      }
    }
  }

  const panelPower = bestPanelCount * bestPanel.outputPowerW!;

  // ---- Inverter selection ----
  const requiredInverterPower = Math.max(3000, Math.ceil((peakPower * 1.25) / 1000) * 1000);
  let bestInverter: Product = inverters[0];
  let bestInverterDiff = Infinity;
  for (const inv of inverters) {
    const diff = Math.abs(inv.outputPowerW! - requiredInverterPower);
    if (diff < bestInverterDiff) {
      bestInverterDiff = diff;
      bestInverter = inv;
    }
  }

  // ---- Battery selection ----
  const requiredBatteryWh = dailyKWh * 1000; // 1 day autonomy
  let bestBattery: Product = batteries[0];
  let bestBatteryDiff = Infinity;
  for (const bat of batteries) {
    const diff = Math.abs(bat.capacityWh! - requiredBatteryWh);
    if (diff < bestBatteryDiff) {
      bestBatteryDiff = diff;
      bestBattery = bat;
    }
  }

  const batteryCapacity = bestBattery.capacityWh! / 1000;
  const autonomyDays = parseFloat((batteryCapacity / dailyKWh).toFixed(1));

  const totalPriceMad = (bestPanel.priceMad || 0) * bestPanelCount
    + (bestBattery.priceMad || 0)
    + (bestInverter.priceMad || 0);

  return {
    panel: bestPanel,
    battery: bestBattery,
    inverter: bestInverter,
    panelCount: bestPanelCount,
    panelPower,
    batteryCapacity,
    autonomyDays,
    inverterPower: bestInverter.outputPowerW!,
    totalPriceMad,
  };
}
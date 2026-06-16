import { Product, ProductRecommendation } from '../types';

const API_BASE = `http://${window.location.hostname}:5000/api`;

let cachedProducts: Product[] | null = null;

export async function fetchProducts(category?: string): Promise<Product[]> {
  try {
    const url = category
      ? `${API_BASE}/products?category=${encodeURIComponent(category)}`
      : `${API_BASE}/products`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch products');
    const data: Product[] = await res.json();
    return data;
  } catch (err) {
    console.error('Error fetching products:', err);
    return [];
  }
}

export async function fetchAllProducts(): Promise<Product[]> {
  if (cachedProducts) return cachedProducts;
  const products = await fetchProducts();
  cachedProducts = products;
  return products;
}

export async function seedProducts(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/products/seed`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed products');
    const data = await res.json();
    console.log('Seed result:', data.message);
    cachedProducts = null; // invalidate cache
    return true;
  } catch (err) {
    console.error('Error seeding products:', err);
    return false;
  }
}

/**
 * Given daily consumption and peak power, selects the best matching products
 * from the database and returns a ProductRecommendation.
 */
export async function getRecommendationFromProducts(
  dailyKWh: number,
  peakPower: number
): Promise<ProductRecommendation | null> {
  const products = await fetchAllProducts();

  if (products.length === 0) {
    // Try to seed products if none exist
    const seeded = await seedProducts();
    if (seeded) {
      const seededProducts = await fetchAllProducts();
      if (seededProducts.length === 0) return null;
    } else {
      return null;
    }
  }

  // Fetch again after potential seed
  const allProducts = cachedProducts || await fetchAllProducts();

  // Smart filtering: use category as primary filter, but also include any product with matching specs
  const panels = allProducts.filter(p => p.category === 'panel' && p.outputPowerW);
  const batteries = allProducts.filter(p => p.category === 'battery' && p.capacityWh);
  const inverters = allProducts.filter(p => p.category === 'inverter' && p.outputPowerW);

  if (panels.length === 0 || batteries.length === 0 || inverters.length === 0) {
    return null;
  }

  // ---- Panel selection ----
  const sunHours = 4.5;
  const requiredPanelPower = (dailyKWh * 1.2 * 1000) / sunHours; // in Watts
  // Pick panel with power closest to required / count
  // We'll try 1..20 panels and find best match
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
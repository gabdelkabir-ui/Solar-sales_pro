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
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  city: string;
  notes: string;
}

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
}

export interface ColumnMapping {
  excelColumn: string;
  field: 'name' | 'phone' | 'city' | 'notes' | 'skip';
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  category: 'panel' | 'battery' | 'inverter';
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
  inverter: Product | null;
  panelCount: number;
  panelPower: number;
  batteryCapacity: number;
  autonomyDays: number;
  inverterPower: number;
  totalPriceMad: number;
}

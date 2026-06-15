export interface Equipment {
  id: string;
  name: string;
  defaultPower: number; // Watts
  icon: string;
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

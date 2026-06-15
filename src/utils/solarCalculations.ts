import { SelectedEquipment, SolarSystemRecommendation } from '../types';

export const calculateConsumption = (equipment: SelectedEquipment[]) => {
  const totalPower = equipment.reduce((sum, item) => sum + item.power * item.quantity, 0);
  const dailyWh = equipment.reduce((sum, item) => sum + item.power * item.quantity * item.hoursPerDay, 0);
  const dailyKWh = dailyWh / 1000;
  const monthlyKWh = dailyKWh * 30;

  return {
    totalPower,
    dailyWh,
    dailyKWh,
    monthlyKWh,
  };
};

export const getSolarRecommendation = (dailyKWh: number, peakPower: number): SolarSystemRecommendation => {
  // Simple heuristic recommendation engine
  
  // Panels: assume 4-5 peak sun hours
  const sunHours = 4.5;
  const requiredPanelPower = (dailyKWh * 1.2) / sunHours; // 20% system loss
  const panelWattage = 550;
  const panelCount = Math.ceil((requiredPanelPower * 1000) / panelWattage);
  
  // Battery: assume 48V system, 1 day autonomy
  // Inverter: peak power * 1.25 safety margin
  const inverterPower = Math.max(3000, Math.ceil((peakPower * 1.25) / 1000) * 1000);

  let batteryModel = "5.12kWh Lithium (LFP)";
  let batteryCapacity = 5.12;
  if (dailyKWh > 10) {
    batteryModel = "10.24kWh Lithium (LFP)";
    batteryCapacity = 10.24;
  } else if (dailyKWh > 20) {
    batteryModel = "20kWh Lithium (LFP) Bank";
    batteryCapacity = 20;
  }

  return {
    panelPower: panelCount * panelWattage,
    panelCount,
    panelModel: `${panelWattage}W Mono Perc`,
    batteryCapacity,
    batteryModel,
    autonomyDays: 1,
    inverterPower,
    inverterModel: `${inverterPower / 1000}kW Hybrid Inverter`,
  };
};

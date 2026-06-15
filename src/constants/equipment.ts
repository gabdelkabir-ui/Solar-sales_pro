import { Equipment } from '../types';

export const EQUIPMENT_CATALOG: Equipment[] = [
  { id: 'led_lamp', name: 'LED Lamp', defaultPower: 10, icon: 'Lightbulb' },
  { id: 'tv', name: 'TV', defaultPower: 100, icon: 'Tv' },
  { id: 'laptop', name: 'Laptop', defaultPower: 65, icon: 'Laptop' },
  { id: 'desktop', name: 'Desktop Computer', defaultPower: 250, icon: 'Monitor' },
  { id: 'fridge', name: 'Refrigerator', defaultPower: 150, icon: 'Kitchen' },
  { id: 'freezer', name: 'Freezer', defaultPower: 200, icon: 'Kitchen' },
  { id: 'washing_machine', name: 'Washing Machine', defaultPower: 500, icon: 'LocalLaundryService' },
  { id: 'dryer', name: 'Dryer', defaultPower: 2500, icon: 'DryCleaning' },
  { id: 'microwave', name: 'Microwave', defaultPower: 1200, icon: 'Microwave' },
  { id: 'electric_oven', name: 'Electric Oven', defaultPower: 2000, icon: 'OutdoorGrill' },
  { id: 'ac', name: 'Air Conditioner', defaultPower: 1500, icon: 'AcUnit' },
  { id: 'water_pump', name: 'Water Pump', defaultPower: 750, icon: 'Waves' },
  { id: 'router', name: 'Router', defaultPower: 15, icon: 'Router' },
  { id: 'cctv', name: 'CCTV Camera', defaultPower: 10, icon: 'Videocam' },
  { id: 'fan', name: 'Fan', defaultPower: 60, icon: 'Air' },
  { id: 'phone_charger', name: 'Phone Charger', defaultPower: 15, icon: 'ChargingStation' },
  { id: 'water_heater', name: 'Water Heater', defaultPower: 3000, icon: 'HotTub' },
  { id: 'other', name: 'Other', defaultPower: 0, icon: 'DeviceUnknown' },
];

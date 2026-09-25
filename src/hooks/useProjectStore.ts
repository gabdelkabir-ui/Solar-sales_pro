import { useState, useEffect } from 'react';
import { CustomerInfo, SelectedEquipment, ProjectData, EnergySimulation } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'solar_calculator_data';

const generateOrderNumber = () => {
  return `BC-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
};

const getDefaultPaymentDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
};

const getDefaultEnergySimulation = (): EnergySimulation => ({
  factureMensuelle: '',
  typeContrat: 'HP/HC',
  consommationHP: '',
  consommationHC: '',
  tarifHP: '',
  tarifHC: '',
  presencePanneaux: false,
});

export const useProjectStore = () => {
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    phone: '',
    city: '',
    notes: '',
  });

  const [equipment, setEquipment] = useState<SelectedEquipment[]>([]);
  const [energySimulation, setEnergySimulation] = useState<EnergySimulation>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: ProjectData = JSON.parse(saved);
        return data.energySimulation || getDefaultEnergySimulation();
      } catch (e) {
        // ignore
      }
    }
    return getDefaultEnergySimulation();
  });
  const [orderNumber, setOrderNumber] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: ProjectData = JSON.parse(saved);
        return data.orderNumber || generateOrderNumber();
      } catch (e) {
        // ignore
      }
    }
    return generateOrderNumber();
  });
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: ProjectData = JSON.parse(saved);
        return data.paymentDate || getDefaultPaymentDate();
      } catch (e) {
        // ignore
      }
    }
    return getDefaultPaymentDate();
  });
  const [savedRecData, setSavedRecData] = useState<Record<string, any> | null>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: ProjectData = JSON.parse(saved);
        setCustomer(data.customer);
        setEquipment(data.equipment);
        if (data.orderNumber) setOrderNumber(data.orderNumber);
        if (data.paymentDate) setPaymentDate(data.paymentDate);
        if (data.energySimulation) setEnergySimulation(data.energySimulation);
      } catch (e) {
        console.error('Failed to load project data', e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    const data: ProjectData = { customer, equipment, orderNumber, paymentDate, energySimulation };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [customer, equipment, orderNumber, paymentDate, energySimulation]);

  const addEquipment = (item: any) => {
    const newEquipment: SelectedEquipment = {
      ...item,
      instanceId: uuidv4(),
      quantity: 1,
      power: item.defaultPower,
      hoursPerDay: 5,
    };
    setEquipment([...equipment, newEquipment]);
  };

  const removeEquipment = (instanceId: string) => {
    setEquipment(equipment.filter((e) => e.instanceId !== instanceId));
  };

  const updateEquipment = (instanceId: string, updates: Partial<SelectedEquipment>) => {
    setEquipment(
      equipment.map((e) => (e.instanceId === instanceId ? { ...e, ...updates } : e))
    );
  };

  const loadProject = (data: { customer: CustomerInfo; equipment: SelectedEquipment[]; orderNumber?: string; paymentDate?: string; recommendation?: Record<string, any>; energySimulation?: EnergySimulation }) => {
    setCustomer(data.customer);
    setEquipment(data.equipment);
    if (data.orderNumber) setOrderNumber(data.orderNumber);
    if (data.paymentDate) setPaymentDate(data.paymentDate);
    if (data.recommendation) setSavedRecData(data.recommendation);
    else setSavedRecData(null);
    if (data.energySimulation) setEnergySimulation(data.energySimulation);
    else setEnergySimulation(getDefaultEnergySimulation());
  };

  const resetProject = () => {
    setCustomer({ name: '', phone: '', city: '', notes: '' });
    setEquipment([]);
    setOrderNumber(generateOrderNumber());
    setPaymentDate(getDefaultPaymentDate());
    setSavedRecData(null);
    setEnergySimulation(getDefaultEnergySimulation());
  };

  return {
    customer,
    setCustomer,
    equipment,
    orderNumber,
    setOrderNumber,
    paymentDate,
    setPaymentDate,
    savedRecData,
    addEquipment,
    removeEquipment,
    updateEquipment,
    loadProject,
    resetProject,
    energySimulation,
    setEnergySimulation,
  };
};
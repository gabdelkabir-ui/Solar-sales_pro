import { useState, useEffect } from 'react';
import { CustomerInfo, SelectedEquipment, ProjectData } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'solar_calculator_data';

export const useProjectStore = () => {
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    phone: '',
    city: '',
    notes: '',
  });

  const [equipment, setEquipment] = useState<SelectedEquipment[]>([]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: ProjectData = JSON.parse(saved);
        setCustomer(data.customer);
        setEquipment(data.equipment);
      } catch (e) {
        console.error('Failed to load project data', e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    const data: ProjectData = { customer, equipment };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [customer, equipment]);

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

  const resetProject = () => {
    setCustomer({ name: '', phone: '', city: '', notes: '' });
    setEquipment([]);
  };

  return {
    customer,
    setCustomer,
    equipment,
    addEquipment,
    removeEquipment,
    updateEquipment,
    resetProject,
  };
};

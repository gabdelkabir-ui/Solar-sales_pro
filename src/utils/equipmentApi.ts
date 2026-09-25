import { Equipment } from '../types';

const API_BASE = `http://${window.location.hostname}:5000/api`;

let cachedEquipment: Equipment[] | null = null;

export async function fetchEquipment(category?: string): Promise<Equipment[]> {
  try {
    const url = category
      ? `${API_BASE}/equipment?category=${encodeURIComponent(category)}`
      : `${API_BASE}/equipment`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch equipment');
    const data: Equipment[] = await res.json();
    return data;
  } catch (err) {
    console.error('Error fetching equipment:', err);
    return [];
  }
}

export async function fetchAllEquipment(): Promise<Equipment[]> {
  if (cachedEquipment) return cachedEquipment;
  const items = await fetchEquipment();
  cachedEquipment = items;
  return items;
}

export async function seedEquipment(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/equipment/seed`, { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error('Failed to seed equipment');
    const data = await res.json();
    console.log('Seed result:', data.message);
    cachedEquipment = null; // invalidate cache
    return true;
  } catch (err) {
    console.error('Error seeding equipment:', err);
    return false;
  }
}

export async function createEquipment(item: {
  name: string;
  defaultPower: number;
  icon: string;
  category: string;
  subCategory: string;
}): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${API_BASE}/equipment`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to create equipment');
    const data = await res.json();
    cachedEquipment = null; // invalidate cache
    return data;
  } catch (err) {
    console.error('Error creating equipment:', err);
    return null;
  }
}

export async function updateEquipment(id: number, item: {
  name: string;
  defaultPower: number;
  icon: string;
  category: string;
  subCategory: string;
}): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/equipment/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to update equipment');
    cachedEquipment = null; // invalidate cache
    return true;
  } catch (err) {
    console.error('Error updating equipment:', err);
    return false;
  }
}

export async function deleteEquipment(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/equipment/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) throw new Error('Failed to delete equipment');
    cachedEquipment = null; // invalidate cache
    return true;
  } catch (err) {
    console.error('Error deleting equipment:', err);
    return false;
  }
}

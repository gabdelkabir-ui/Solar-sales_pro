import { Product } from '../types';

export const PRODUCT_CATALOG: Product[] = [
  {
    id: 1,
    name: "BLUETTI Premium 100 V2",
    slug: "premium-100-v2",
    category: "battery",
    brand: "BLUETTI",
    capacityWh: 1024,
    outputPowerW: 1800,
    expandable: false,
    description:
      "Portable LiFePO4 power station with 1024Wh capacity, 1800W AC output (2700W Power Lifting), ultra-fast charging and 1000W solar input.",
    keyFeatures: [
      "1024Wh LiFePO4 battery",
      "1800W AC output (2700W peak Power Lifting)",
      "1000W solar input",
      "1200W Turbo AC charging",
      "80% charge in 45 minutes",
      "4000+ battery cycles",
      "30dB quiet operation",
      "10-year battery lifespan"
    ],
    priceMad: null,
    url: "https://fr.bluettipower.eu/products/bluetti-premium-100-v2-station-d-energie-portable?srsltid=AfmBOoqowoovTay4M7eUny9whM4rVtXxq3RDPiJFidC_pkl_hxBM_mn6",
    imageUrl: "https://fr.bluettipower.eu/cdn/shop/files/Premium100V2EU_1.svg?v=1776948374&width=800",
    isActive: true,
    createdAt: "2026-07-06T10:00:00.000Z",
    updatedAt: "2026-07-06T10:00:00.000Z"
  },

  {
    id: 2,
    name: "BLUETTI Balco 260",
    slug: "balco-260",
    category: "battery",
    brand: "BLUETTI",
    capacityWh: 2560,
    outputPowerW: 1200,
    expandable: true,
    description:
      "Smart balcony solar energy storage system with integrated bidirectional inverter and expandable LiFePO4 battery.",
    keyFeatures: [
      "2560Wh LiFePO4 battery",
      "1200W bidirectional inverter",
      "2400W solar input (4 MPPT)",
      "Expandable to 15kWh",
      "96.1% conversion efficiency",
      "6000 battery cycles",
      "IP65 protection",
      "Wi-Fi & Bluetooth"
    ],
    priceMad: null,
    url: "https://www.easypower.ma/",
    imageUrl: "",
    isActive: true,
    createdAt: "2026-07-06T10:00:00.000Z",
    updatedAt: "2026-07-06T10:00:00.000Z"
  },

  {
    id: 3,
    name: "BLUETTI BC260 Expansion Battery",
    slug: "bc260-expansion-battery",
    category: "battery",
    brand: "BLUETTI",
    capacityWh: 2560,
    outputPowerW: null,
    expandable: false,
    description:
      "Expansion battery for the BLUETTI Balco 260 system.",
    keyFeatures: [
      "2560Wh capacity",
      "LiFePO4 battery",
      "6000+ cycles",
      "Expandable system up to 15kWh",
      "IP65 protection",
      "25kg weight"
    ],
    priceMad: null,
    url: "https://www.easypower.ma/",
    imageUrl: "https://cdn.shopify.com/s/files/1/0566/6396/5893/files/Elite-200-V2-2025-02-13.png?v=1762851693&width=1125&height=1125&crop=center",
    isActive: true,
    createdAt: "2026-07-06T10:00:00.000Z",
    updatedAt: "2026-07-06T10:00:00.000Z"
  },

  {
    id: 4,
    name: "BLUETTI 400W Portable Solar Panel",
    slug: "400w-portable-solar-panel",
    category: "panel",
    brand: "BLUETTI",
    capacityWh: null,
    outputPowerW: 400,
    expandable: false,
    description:
      "Foldable 400W portable solar panel designed for BLUETTI portable power stations and energy storage systems.",
    keyFeatures: [
      "400W output",
      "Foldable design",
      "Portable",
      "High conversion efficiency",
      "Compatible with BLUETTI power stations",
      "Outdoor use"
    ],
    priceMad: null,
    url: "https://www.easypower.ma/en/shop/pso-000008-400w-portable-solar-panel-87#attr=205,206",
    imageUrl: "https://www.easypower.ma/web/image/product.product/87/image_1024/%5BPSO-000008%5D%20400W%20PORTABLE%20SOLAR%20PANEL?unique=b565004",
    isActive: true,
    createdAt: "2026-07-06T10:00:00.000Z",
    updatedAt: "2026-07-06T10:00:00.000Z"
  }
];

export const getProductsByCategory = (
  category: 'panel' | 'battery' | 'inverter'
): Product[] => {
  return PRODUCT_CATALOG.filter(p => p.category === category);
};
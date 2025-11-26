

export interface ProductData {
  sku: string;
  asin: string; // New field
  name: string;
  // Removed: platform: string;
  // Removed: quantity: number | '';
  // Removed: price: number | '';
  // Removed: supplier: string;
  description: string;
  image: File | null;
  // New measurement fields
  length: number | '';
  width: number | '';
  height: number | '';
  dimensionUnit: 'cm' | 'in' | '';
  weight: number | '';
  weightUnit: 'g' | 'kg' | 'lb' | 'oz' | '';
}

export interface ValidationErrors {
  sku?: string;
  asin?: string; // New validation error
  name?: string;
  // Removed: platform?: string;
  // Removed: quantity?: string;
  // Removed: price?: string;
  // Removed: supplier?: string;
  image?: string;
  // New measurement validation errors
  length?: string;
  width?: string;
  height?: string;
  dimensionUnit?: string;
  weight?: string;
  weightUnit?: string;
}

export const INITIAL_PRODUCT_DATA: ProductData = {
  sku: '',
  asin: '', // New default
  name: '',
  // Removed: platform: '',
  // Removed: quantity: '',
  // Removed: price: '',
  // Removed: supplier: '',
  description: '',
  image: null,
  // New measurement defaults
  length: '',
  width: '',
  height: '',
  dimensionUnit: 'in', // Default to 'in'
  weight: '',
  weightUnit: 'lb', // Default to 'lb'
};

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  warehouse: string;
  bin?: string;
  supplier: string;
  onHand: number;
  available: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued';
  lastUpdated: string;
  price: number;
  // Added for ItemsTable display
  imageUrl?: string;
  asin?: string;
  productDimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  productWeight?: number;
  weightUnit?: string;
}

export type ShipmentStatus = 'Draft' | 'In Progress' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Shipment {
  id: string;
  shipmentId: string;
  name: string;
  destination: string;
  originWarehouse: string;
  totalItems: number;
  carrier: string;
  status: ShipmentStatus;
  createdDate: string;
  lastUpdated: string;
  items?: ShipmentItem[]; // Added optional items property to Shipment interface
  packingLines?: PackingLine[]; // New: Added packing lines
  isPriority?: boolean; // New: Added priority status
  priorityIndex?: number; // New: Added priority index
}

export interface PackingLine {
  boxCount: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string; // Assuming unit for dimensions
  };
  weight: number;
  weightUnit: string; // Assuming unit for weight
  unitsPerBox: { sku: string; quantity: number }[];
}

export interface ShipmentItem {
  sku: string;
  name: string;
  quantity: number;
  asin: string; // New field
}

export interface BoxType {
  id: string;
  boxCount: number;
  length: number;
  width: number;
  height: number;
  weightPerBox: number;
  unitsPerProduct: Record<string, number>; // SKU -> quantity per box
}

export interface PackingConfiguration {
  shipmentId: string;
  totalPlannedBoxes: number;
  boxTypes: BoxType[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
}
export interface Printer {
  id: string;
  name: string;
  location?: string;
  isDefault?: boolean;
  type?: 'system' | 'mock' | 'printnode';
  description?: string;
}

export interface PrintNodeConfig {
  apiKey: string;
  printerId: string;
}

export interface PrintOptions {
  printNodeApiKey?: string;
  printNodePrinterId?: string;
  copies?: number;
  title?: string;
}

export interface ItemData {
  name: string;
  barcode?: string;
  id?: string;
  description?: string;
  price: number;
  imageUrl?: string;
  [key: string]: any; // Allow for additional properties
}

export type PrintStatus = 'idle' | 'printing' | 'success' | 'error'; 
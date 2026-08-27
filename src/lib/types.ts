export type Role = "propietario" | "administrador" | "encargado" | "cajero" | "vendedor" | "mozo" | "cocina" | "solo_lectura";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  currency: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  organizationId: string;
  branchId: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Product {
  id: string;
  organizationId: string;
  branchId: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unitType: "unidad" | "peso";
  active: boolean;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  organizationId: string;
  branchId: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  items: SaleItem[];
}

export interface CashSession {
  id: string;
  organizationId: string;
  branchId: string;
  status: "abierta" | "cerrada";
  openingAmount: number;
  declaredAmount: number;
  expectedAmount: number;
  openedAt: string;
  closedAt?: string;
}

export interface TableSession {
  id: string;
  organizationId: string;
  branchId: string;
  tableNumber: number;
  status: "libre" | "ocupada" | "pendiente" | "por_cobrar";
  guests: number;
  waiter: string;
  total: number;
  updatedAt: string;
}

export interface AppStore {
  organizations: Organization[];
  branches: Branch[];
  users: UserProfile[];
  products: Product[];
  sales: Sale[];
  cashSessions: CashSession[];
  tables: TableSession[];
  auditLogs: Array<{ id: string; action: string; entity: string; user: string; createdAt: string }>;
}

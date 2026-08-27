import type { Product } from "./types";

export type StoreEventType = "products" | "sales" | "documents";

export interface SaleItemSnapshot {
  productId: string;
  name: string;
  price: number;
  unitType: "unidad" | "peso";
  quantity: number;
  total: number;
}

export interface SaleRecord {
  id: string;
  createdAt: string;
  customerName: string;
  paymentMethod: string;
  total: number;
  items: SaleItemSnapshot[];
}

export interface SaleDocument {
  id: string;
  saleId: string;
  type: "ticket" | "factura";
  createdAt: string;
  customerName: string;
  paymentMethod: string;
  subtotal: number;
  total: number;
  items: SaleItemSnapshot[];
}

const PRODUCTS_CACHE_KEY = "verduleria-products";
const SALES_CACHE_KEY = "verduleria-sales";
const DOCUMENTS_CACHE_KEY = "verduleria-documents";
const SYNC_EVENT_NAME = "verduleria:sync";
const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

export function formatArgentinaDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ARGENTINA_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatArgentinaDate(value: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ARGENTINA_TIME_ZONE,
    dateStyle: "short",
  }).format(new Date(value));
}

export function readCachedProducts(): Product[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(PRODUCTS_CACHE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as Product[];
  } catch {
    return [];
  }
}

export function writeCachedProducts(products: Product[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
}

export function readCachedSales(): SaleRecord[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(SALES_CACHE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as SaleRecord[];
  } catch {
    return [];
  }
}

export function writeCachedSales(sales: SaleRecord[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SALES_CACHE_KEY, JSON.stringify(sales));
}

export function readCachedDocuments(): SaleDocument[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(DOCUMENTS_CACHE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as SaleDocument[];
  } catch {
    return [];
  }
}

export function writeCachedDocuments(documents: SaleDocument[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DOCUMENTS_CACHE_KEY, JSON.stringify(documents));
}

export function notifyStoreUpdate(kind: StoreEventType): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: { kind } }));
}

export function subscribeToStoreUpdates(handler: (kind: StoreEventType) => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const listener = (event: Event) => {
    const detail = (event as CustomEvent<{ kind?: StoreEventType }>).detail;
    if (detail?.kind) {
      handler(detail.kind);
    }
  };

  window.addEventListener(SYNC_EVENT_NAME, listener as EventListener);
  return () => window.removeEventListener(SYNC_EVENT_NAME, listener as EventListener);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value);
}

export function buildDocumentHtml(document: SaleDocument): string {
  const documentDate = formatArgentinaDateTime(document.createdAt);
  const lines = document.items
    .map((item) => {
      const quantity = item.unitType === "peso" ? `${item.quantity.toFixed(3)} kg` : `${item.quantity} u`;
      return `<div style="display:flex;justify-content:space-between;gap:12px;margin:4px 0;"><span>${item.name}<br /><small>${quantity} × ${formatCurrency(item.price)}</small></span><span>${formatCurrency(item.total)}</span></div>`;
    })
    .join("");

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${document.type === "factura" ? "Factura" : "Ticket"}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 16px; color: #111827; width: 320px; }
        .title { font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 8px; }
        .date { font-size: 15px; font-weight: 700; text-align: center; margin-bottom: 6px; }
        .meta { font-size: 12px; color: #6b7280; margin-bottom: 12px; text-align: center; }
        .row { display:flex; justify-content:space-between; margin:6px 0; }
        .divider { border-top: 1px dashed #9ca3af; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="title">${document.type === "factura" ? "Factura" : "Ticket"}</div>
      <div class="date">${documentDate}</div>
      <div class="meta">Comprobante: ${document.id}</div>
      <div class="row"><strong>Cliente</strong><span>${document.customerName}</span></div>
      <div class="row"><strong>Método</strong><span>${document.paymentMethod}</span></div>
      <div class="divider"></div>
      ${lines}
      <div class="divider"></div>
      <div class="row"><strong>Subtotal</strong><span>${formatCurrency(document.subtotal)}</span></div>
      <div class="row"><strong>Total</strong><span>${formatCurrency(document.total)}</span></div>
    </body>
  </html>`;
}

export function printSaleDocument(document: SaleDocument): void {
  if (typeof window === "undefined") return;
  const printWindow = window.open("", "_blank", "width=420,height=720");
  if (!printWindow) return;
  printWindow.document.write(buildDocumentHtml(document));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export interface ShippingItem {
  id: number;
  company: string;
  tableName?: string | null; // ⬅️ NUEVO
  shipDate: string;
  poNumber: string;
  sap: string;
  claveProducto: string;
  customerItemNumber: string;
  itemDescription: string;
  quantityAlreadyShipped: string;
  pallets: number;
  casesPerPallet: number;
  unitsPerCase: number;
  grossWeight: number;
  netWeight: number;
  itemType: string;
  salesCSRNames: string;
  trazabilidades: string;
  destino: string;
  idReleaseCliente?: string | null; // ⬅️ NUEVO
  createdDate: string;
  modifiedDate: string | null;
  modifiedBy: string;
  quantityOnFloor: number;
  precioPorUnidad: number;
  pesoPorPieza: number;
  costoTotal: number;
  valorAduanal: number;
}

export interface ReleaseDetailData {
    id: number;
    fileName: string;
    description: string;
    createdDate: string;
    modifiedDate: string | null;
    createdBy: string;
    modifiedBy: string;
    status: string;
    releaseDate: string | null;
    notes: string;
    totalItems: number;
    shippingItems: ShippingItem[];
}
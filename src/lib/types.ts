export type LotStatus = "released" | "quarantine" | "blocked" | "expired";

export type Client = {
  id: number;
  brandName: string;
  legalName: string;
  taxId: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  createdAt: string;
};

export type Product = {
  id: number;
  clientId: number;
  clientBrandName: string;
  sku: string;
  name: string;
  category: string | null;
  description: string | null;
  formulaVersion: string | null;
  active: boolean;
  createdAt: string;
};

export type Lot = {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  clientId: number;
  clientBrandName: string;
  code: string;
  manufacturingDate: string;
  expirationDate: string;
  quantity: number;
  unit: string;
  status: LotStatus;
  origin: string | null;
  analysisSummary: string | null;
  traceabilityNotes: string | null;
  createdAt: string;
};

export type PublicLot = Lot & {
  legalName: string;
  productCategory: string | null;
  productDescription: string | null;
  formulaVersion: string | null;
};

export type DashboardStats = {
  activeClients: number;
  activeProducts: number;
  totalLots: number;
  releasedLots: number;
  quarantineLots: number;
  expiringLots: number;
};

export type CreateClientInput = {
  brandName: string;
  legalName: string;
  taxId?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  active?: boolean;
};

export type CreateProductInput = {
  clientId: number;
  sku: string;
  name: string;
  category?: string | null;
  description?: string | null;
  formulaVersion?: string | null;
  active?: boolean;
};

export type CreateLotInput = {
  productId: number;
  code: string;
  manufacturingDate: string;
  expirationDate: string;
  quantity: number;
  unit?: string | null;
  status: LotStatus;
  origin?: string | null;
  analysisSummary?: string | null;
  traceabilityNotes?: string | null;
};

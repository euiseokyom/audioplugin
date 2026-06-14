export interface Retailer {
  slug: string;
  name: string;
  baseUrl: string;
  logoUrl: string;
  isManufacturerDirect?: boolean;
}

export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  category: string;
  manufacturer: string;
  registeredPrice: number;
  salesCount: number;
  tags: string[];
  canonicalId: string;
  dealEndsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPriceEntry {
  _id: string;
  productId: string;
  retailerSlug: string;
  retailer?: Retailer;
  affiliateUrl: string;
  price: number;
  currency: string;
  scrapedAt: string;
  isLowest?: boolean;
}

export interface IAlert {
  _id: string;
  userId: string;
  productId: string;
  product?: IProduct;
  targetPrice: number;
  isTriggered: boolean;
  triggeredAt?: string;
  createdAt: string;
}

export interface AlertWithProduct extends IAlert {
  product: ProductWithPrices;
}

export interface IFavorite {
  _id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface IScraperLog {
  _id: string;
  retailerSlug: string;
  startedAt: string;
  finishedAt?: string;
  status: "pending" | "running" | "success" | "failed" | "partial";
  type?: "scheduled" | "manual";
  errorMessage?: string;
  itemsScraped: number;
  productsAdded?: number;
  productsUpdated?: number;
  failedUrls: string[];
  screenshotUrl?: string;
  rawHtmlPath?: string;
}

export type RetailerHealth = "healthy" | "warning" | "error";

export interface RetailerDashboardEntry {
  slug: string;
  name: string;
  health: RetailerHealth;
  lastSuccessAt: string | null;
  productCount: number;
  hasPendingJob?: boolean;
  isActive: boolean;
}

export interface AdminDashboardStats {
  totalProducts: number;
  activeRetailers: number;
  lastSuccessfulRun: IScraperLog | null;
  productsAdded24h: number;
  productsUpdated24h: number;
}

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  recentRuns: IScraperLog[];
  retailers: RetailerDashboardEntry[];
  fetchedAt: string;
}

export type SystemHealthStatus = "healthy" | "warning" | "error";

export interface SystemHealthSummary {
  status: SystemHealthStatus;
  lastSuccessfulRun: IScraperLog | null;
  recentFailureCount: number;
  pendingJobCount: number;
  retailerErrorCount: number;
  retailerWarningCount: number;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
  retailerSlug: string;
}

export interface ProductWithPrices extends IProduct {
  currentPrices: IPriceEntry[];
  lowestPrice: number;
  discountPercent: number;
  isAllTimeLow?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin?: boolean;
    };
  }
}

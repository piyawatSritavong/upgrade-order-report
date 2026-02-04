export interface AggregatedItem {
  subCategoryId: string;
  categoryId: string;
  buyQty: number;
  buyTotal: number;
  sellQty: number;
  sellTotal: number
  stockBalance: number;
  moneyBalance: number;
  orderId?: string;
  orderFinishedDate?: string;
}

export interface OrderApiResponse {
  data: AggregatedItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface Category {
  categoryId: string;
  categoryName: string;
  subcategory?: {
    subCategoryId: string;
    subCategoryName: string;
  }[];
}

export interface GradeDetail {
  grade?: string;
  price?: number;
  quantity?: string | number;
  total?: number;
}

export interface RequestItem {
  categoryID?: string;
  subCategoryID?: string;
  requestList?: GradeDetail[];
}

export interface Transaction {
  orderId: string;
  requestList?: RequestItem[];
  orderFinishedDate?: string;
  orderFinishedTime?: string;
}

export interface DemoApiResponse {
  buyTransaction?: Transaction[];
  sellTransaction?: Transaction[];
}
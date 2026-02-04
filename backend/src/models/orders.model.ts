export type OrdersQuery = {
  limit: number;
  page: number;
  categoryId?: string;
  subCategoryId?: string;
  startDate?: string;
  endDate?: string;
  orderId?: string;
  grade?: string;
  minSellTotal?: number;
  maxSellTotal?: number;
}
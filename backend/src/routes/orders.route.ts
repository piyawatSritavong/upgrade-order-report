import { Router } from "express";
import { z } from "zod";
import { getOrders } from "../services/orders.service.js";

export const ordersRouter = Router();

const OrdersQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  page: z.coerce.number().min(1).default(1),
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  orderId: z.string().optional(),
  grade: z.string().optional(),
  minSellTotal: z.coerce.number().min(0).default(0),
  maxSellTotal: z.coerce.number().min(0).default(Number.MAX_SAFE_INTEGER),
});

ordersRouter.get("/orders", async (req, res) => {
  try {
    const parsedQuery = OrdersQuerySchema.parse(req.query);
    const result = await getOrders({
      limit: parsedQuery.limit,
      page: parsedQuery.page,
      ...(parsedQuery.categoryId && { categoryId: parsedQuery.categoryId }),
      ...(parsedQuery.subCategoryId && { subCategoryId: parsedQuery.subCategoryId }),
      ...(parsedQuery.startDate && { startDate: parsedQuery.startDate }),
      ...(parsedQuery.endDate && { endDate: parsedQuery.endDate }),
      ...(parsedQuery.orderId && { orderId: parsedQuery.orderId }),
      ...(parsedQuery.grade && { grade: parsedQuery.grade }),
      minSellTotal: parsedQuery.minSellTotal ?? Number.NEGATIVE_INFINITY,
      maxSellTotal: parsedQuery.maxSellTotal ?? Number.POSITIVE_INFINITY,
    });
    res.json(result);
  } catch (e: any) {
    console.log("Error fetching orders:", e);
    res.status(500).json({ error: e.message });
  }
});
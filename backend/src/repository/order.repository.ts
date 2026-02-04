import { sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import type { OrdersQuery } from "../models/orders.model.js";

export const fetchOrdersFromDB = async (q: OrdersQuery & { offset: number }) => {
  const filters = {
    catId: q.categoryId ?? null,
    subCatId: q.subCategoryId ?? null,
    grade: q.grade ?? null,
    orderLike: q.orderId ? `%${q.orderId}%` : null,
    start: q.startDate ?? null,
    end: q.endDate ?? null,
    minSell: q.minSellTotal ?? 0,
    maxSell: q.maxSellTotal ?? Number.MAX_SAFE_INTEGER,
  };

  const whereClause = sql`
    WHERE
      (${filters.catId}::text IS NULL OR oi.category_id = ${filters.catId})
      AND (${filters.subCatId}::text IS NULL OR oi.sub_category_id = ${filters.subCatId})
      AND (${filters.grade}::text IS NULL OR oi.grade = ${filters.grade})
      AND (${filters.orderLike}::text IS NULL OR o.external_order_id ILIKE ${filters.orderLike})
      AND (${filters.start}::text IS NULL OR o.order_finished_date >= ${filters.start}::date)
      AND (${filters.end}::text IS NULL OR o.order_finished_date <= ${filters.end}::date)
  `;

  const dataQuery = sql`
    WITH filtered AS (
      SELECT oi.sub_category_id, oi.category_id, o.order_type, o.external_order_id, 
             o.order_finished_date, oi.quantity, oi.total
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      ${whereClause}
    ),
    agg AS (
      SELECT sub_category_id, MIN(category_id) AS category_id,
        COALESCE(SUM(quantity) FILTER (WHERE order_type = 'buy'), 0)  AS buy_qty,
        COALESCE(SUM(total)    FILTER (WHERE order_type = 'buy'), 0)  AS buy_total,
        COALESCE(SUM(quantity) FILTER (WHERE order_type = 'sell'), 0) AS sell_qty,
        COALESCE(SUM(total)    FILTER (WHERE order_type = 'sell'), 0) AS sell_total
      FROM filtered
      GROUP BY sub_category_id
      HAVING COALESCE(SUM(total) FILTER (WHERE order_type = 'sell'), 0) BETWEEN ${filters.minSell} AND ${filters.maxSell}
    ),
    latest AS (
      SELECT DISTINCT ON (sub_category_id) sub_category_id, external_order_id, order_finished_date
      FROM filtered
      ORDER BY sub_category_id, order_finished_date DESC, external_order_id DESC
    )
    SELECT a.*, l.external_order_id as order_id, l.order_finished_date
    FROM agg a
    LEFT JOIN latest l USING (sub_category_id)
    ORDER BY a.sub_category_id
    LIMIT ${q.limit} OFFSET ${q.offset}
  `;

  const countQuery = sql`
    WITH filtered AS (
      SELECT oi.sub_category_id, o.order_type, oi.total
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      ${whereClause}
    ),
    agg AS (
      SELECT sub_category_id
      FROM filtered
      GROUP BY sub_category_id
      HAVING COALESCE(SUM(total) FILTER (WHERE order_type = 'sell'), 0) BETWEEN ${filters.minSell} AND ${filters.maxSell}
    )
    SELECT COUNT(*)::int AS total_items FROM agg
  `;

  const [dataResult, countResult] = await Promise.all([
    db.execute(dataQuery),
    db.execute(countQuery)
  ]);

  return { 
    rows: (dataResult.rows as any[]) || [], 
    totalItems: Number(countResult.rows[0]?.total_items ?? 0) 
  };
};
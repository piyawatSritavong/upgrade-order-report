import type { OrdersQuery } from "../models/orders.model.js";
import { fetchOrdersFromDB } from "../repository/order.repository.js";

export const getOrders = async (q: OrdersQuery) => {
  const offset = (q.page - 1) * q.limit;
  const { rows, totalItems } = await fetchOrdersFromDB({ ...q, offset });

  const data = rows.map((r) => {
    const buyQty = Number(r.buy_qty || 0);
    const buyTotal = Number(r.buy_total || 0);
    const sellQty = Number(r.sell_qty || 0);
    const sellTotal = Number(r.sell_total || 0);

    return {
      subCategoryId: String(r.sub_category_id),
      categoryId: String(r.category_id),
      buyQty,
      buyTotal,
      sellQty,
      sellTotal,
      stockBalance: buyQty - sellQty,
      moneyBalance: buyTotal - sellTotal,
      orderId: r.order_id,
      orderFinishedDate: r.order_finished_date
    };
  });

  return { 
    data, 
    totalItems, 
    totalPages: Math.ceil(totalItems / q.limit), 
    currentPage: q.page 
  };
};
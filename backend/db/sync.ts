import "dotenv/config";
import { z } from "zod";
import { pool, db } from "./index.js";
import { categories, subcategories, orders, orderItems } from "./schema.js";

const stringOrNumber = z.union([z.string(), z.number()]).transform(v => String(v));

const CategoryResponseSchema = z.object({
  productList: z.array(z.object({
    categoryId: stringOrNumber,
    categoryName: z.string(),
    subcategories: z.array(z.object({
      subcategoryId: stringOrNumber,
      subcategoryName: z.string(),
    })).optional().nullable(),
  })),
});

const GradeDetailSchema = z.object({
  grade: z.string().nullable().optional(),
  quantity: stringOrNumber,
  total: stringOrNumber,
  price: stringOrNumber.nullable().optional(),
});

const RequestItemSchema = z.object({
  categoryID: stringOrNumber.optional().nullable(),
  subCategoryID: stringOrNumber.optional().nullable(),
  requestList: z.array(GradeDetailSchema).optional().nullable(),
}).transform(v => ({
  categoryId: v.categoryID,
  subcategoryId: v.subCategoryID,
  requestList: v.requestList
}));

const TransactionSchema = z.object({
  orderId: stringOrNumber,
  orderFinishedDate: z.string().optional().nullable(),
  orderFinishedTime: z.string().optional().nullable(),
  requestList: z.array(RequestItemSchema).optional().nullable(),
});

const OrderResponseSchema = z.object({
  buyTransaction: z.array(TransactionSchema).optional().nullable(),
  sellTransaction: z.array(TransactionSchema).optional().nullable(),
});

const toNumber = (v: any, fallback: number = 0) => {
  if (v === null || v === undefined) return fallback;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

const toDateOnly = (v: string | null | undefined) => {
  if (!v || typeof v !== 'string') return null;
  const match = v.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

const toTimeOnly = (v: string | null | undefined) => {
  if (!v || typeof v !== 'string') return null;
  const match = v.match(/^\d{2}:\d{2}:\d{2}/);
  return match ? match[0] : null;
}

const syncCategories = async () => {
  const response = await fetch('https://apirecycle.unii.co.th/category/query-product-demo', { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`);
  const json = await response.json();
  const parsed = CategoryResponseSchema.parse(json);

  for (const c of parsed.productList) {
    await db.insert(categories).values({
      categoryId: c.categoryId,
      categoryName: c.categoryName,
    }).onConflictDoUpdate({
      target: categories.categoryId,
      set: { categoryName: c.categoryName },
    });

    await db.insert(subcategories).values({
      subcategoryId: `NONE-${c.categoryId}`,
      categoryId: String(c.categoryId),
      subcategoryName: "ไม่ระบุหมวดหมู่ย่อย",
    }).onConflictDoNothing();

    for (const s of c.subcategories || []) {
      if (!s.subcategoryId) continue;
      await db.insert(subcategories).values({
        subcategoryId: String(s.subcategoryId),
        categoryId: String(c.categoryId),
        subcategoryName: s.subcategoryName || "ไม่มีชื่อกลุ่มย่อย",
      }).onConflictDoUpdate({
        target: subcategories.subcategoryId,
        set: {
          categoryId: String(c.categoryId),
          subcategoryName: s.subcategoryName || "ไม่มีชื่อกลุ่มย่อย"
        },
      });
    }
  }
  console.log("Categories synchronized");
};

const upsertOrderAndItems = async (tx: z.infer<typeof TransactionSchema>, orderType: "buy" | "sell") => {
  const dateOnly = toDateOnly(tx.orderFinishedDate);
  const timeOnly = toTimeOnly(tx.orderFinishedTime);
  const finishedAt = dateOnly && timeOnly ? new Date(`${dateOnly}T${timeOnly}`) : new Date();

  const inserted = await db.insert(orders).values({
    externalOrderId: tx.orderId,
    orderType,
    orderFinishedDate: dateOnly ?? undefined,
    orderFinishedTime: timeOnly ?? undefined,
    finishedAt: finishedAt,
    rawPayload: JSON.stringify(tx),
  }).onConflictDoUpdate({
    target: [orders.externalOrderId, orders.orderType],
    set: {
      orderFinishedDate: dateOnly ?? undefined,
      orderFinishedTime: timeOnly ?? undefined,
      finishedAt: finishedAt,
      rawPayload: JSON.stringify(tx),
    },
  }).returning({ id: orders.id });

  const orderDbId = inserted[0]?.id;
  if (!orderDbId) return;

  for (const cat of tx.requestList || []) {
    const categoryId = String(cat.categoryId || "");
    let subcategoryId = String(cat.subcategoryId || "");

    if (!categoryId) {
      console.warn("Skipping: Missing Category ID");
      continue;
    }

    if (!subcategoryId || subcategoryId === "undefined" || subcategoryId === "null") {
      subcategoryId = `NONE-${categoryId}`;
    }

    try {
      await db.insert(categories).values({
        categoryId: categoryId,
        categoryName: `หมวดหมู่สำรอง (${categoryId})`,
      }).onConflictDoNothing();

      await db.insert(subcategories).values({
        subcategoryId: subcategoryId,
        categoryId: categoryId,
        subcategoryName: `กลุ่มย่อยสำรอง (${subcategoryId})`,
      }).onConflictDoNothing();
    } catch (e: any) {
      console.error("Failed to ensure Foreign Keys:", e.message);
    }

    const items = cat.requestList || [];
    if (items.length === 0) console.log("No items in this category request");

    for (const g of items) {
      const grade = g.grade || "ทั่วไป";
      const quantity = toNumber(g.quantity);
      const total = toNumber(g.total);
      const price = g.price ? toNumber(g.price).toString() : "0";

      try {
        await db.insert(orderItems).values({
          orderId: orderDbId,
          categoryId,
          subcategoryId,
          grade,
          quantity: toNumber(g.quantity).toString(),
          total: toNumber(g.total).toString(),
          price: g.price ? toNumber(g.price).toString() : "0",
        }).onConflictDoUpdate({
          target: [orderItems.orderId, orderItems.subcategoryId, orderItems.grade],
          set: {
            categoryId,
            quantity: toNumber(g.quantity).toString(),
            total: toNumber(g.total).toString(),
            price: g.price ? toNumber(g.price).toString() : "0",
          },
        });
      } catch (e: any) {
        console.error(`Failed to insert order item: ${grade}`, e.message);
      }
    }
  }
}

const syncOrders = async () => {
  const response = await fetch('https://apirecycle.unii.co.th/Stock/query-transaction-demo', { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to fetch orders: ${response.status}`);
  const json = await response.json();

  const result = OrderResponseSchema.safeParse(json);

  if (!result.success) {
    console.error("Zod Validation Error:", JSON.stringify(result.error.format(), null, 2));
    return;
  }

  const { buyTransaction, sellTransaction } = result.data;

  for (const b of buyTransaction || []) {
    await upsertOrderAndItems(b, "buy");
  }
  for (const s of sellTransaction || []) {
    await upsertOrderAndItems(s, "sell");
  }

  console.log("Orders synchronized");
}

const main = async () => {
  try {
    await syncCategories();
    await syncOrders();
    console.log("All processes completed");
  } catch (error) {
    console.error("Process failed:", error);
  } finally {
    await pool.end();
  }
}

main();
import {
  pgTable,
  text,
  numeric,
  integer,
  serial,
  timestamp,
  date,
  time,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  categoryId: text("category_id").primaryKey(),
  categoryName: text("category_name").notNull(),
});

export const subcategories = pgTable("subcategories", {
  subcategoryId: text("sub_category_id").primaryKey(),
  categoryId: text("category_id").notNull().references(() => categories.categoryId),
  subcategoryName: text("sub_category_name").notNull(),
}, (t) => ({
  categoryIdIdx: index("subcategories_category_id_idx").on(t.categoryId),
}));

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  externalOrderId: text("external_order_id").notNull(),
  orderType: text("order_type").notNull(),
  orderFinishedDate: date("order_finished_date"),
  orderFinishedTime: time("order_finished_time"),
  finishedAt: timestamp("finished_at", {withTimezone: false}),
  rawPayload: text("raw_payload"),
}, (t) => ({
  uniqExternalType: uniqueIndex("orders_external_order_id_type_ux").on(t.externalOrderId, t.orderType),
  finishedDateIdx: index("orders_finished_date_idx").on(t.finishedAt),
}));

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  categoryId: text("category_id").notNull().references(() => categories.categoryId),
  subcategoryId: text("sub_category_id").notNull().references(() => subcategories.subcategoryId),
  grade: text("grade"),
  quantity: numeric("quantity", { precision: 18, scale: 4 }).notNull().default("0"),
  total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
  price: numeric("price", { precision: 18, scale: 2 }),
}, (t) => ({
  uniqOrderSubGrade: uniqueIndex("order_items_order_sub_grade_ux").on(t.orderId, t.subcategoryId, t.grade),
  subIdx: index("order_items_subcategory_idx").on(t.subcategoryId),
  categoryIdx: index("order_items_category_idx").on(t.categoryId),
}));
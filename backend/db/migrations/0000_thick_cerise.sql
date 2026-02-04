CREATE TABLE "categories" (
	"category_id" text PRIMARY KEY NOT NULL,
	"category_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"category_id" text NOT NULL,
	"sub_category_id" text NOT NULL,
	"grade" text,
	"quantity" numeric(18, 4) DEFAULT '0' NOT NULL,
	"total" numeric(18, 2) DEFAULT '0' NOT NULL,
	"price" numeric(18, 2)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_order_id" text NOT NULL,
	"order_type" text NOT NULL,
	"order_finished_date" date,
	"order_finished_time" time,
	"finished_at" timestamp,
	"raw_payload" text
);
--> statement-breakpoint
CREATE TABLE "subcategories" (
	"sub_category_id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"sub_category_name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_category_id_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_sub_category_id_subcategories_sub_category_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."subcategories"("sub_category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "order_items_order_sub_grade_ux" ON "order_items" USING btree ("order_id","sub_category_id","grade");--> statement-breakpoint
CREATE INDEX "order_items_subcategory_idx" ON "order_items" USING btree ("sub_category_id");--> statement-breakpoint
CREATE INDEX "order_items_category_idx" ON "order_items" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_external_order_id_type_ux" ON "orders" USING btree ("external_order_id","order_type");--> statement-breakpoint
CREATE INDEX "orders_finished_date_idx" ON "orders" USING btree ("finished_at");--> statement-breakpoint
CREATE INDEX "subcategories_category_id_idx" ON "subcategories" USING btree ("category_id");
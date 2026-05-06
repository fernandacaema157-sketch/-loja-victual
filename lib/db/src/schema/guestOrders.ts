import {
  pgTable,
  serial,
  text,
  numeric,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const guestOrdersTable = pgTable("guest_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  guestName: text("guest_name").notNull(),
  whatsapp: text("whatsapp").notNull(),
  items: jsonb("items").$type<GuestOrderItem[]>().notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type GuestOrderItem = {
  productId?: number;
  productName: string;
  team: string;
  size: string;
  quantity: number;
  price: number;
  customName?: string;
  customNumber?: string;
};

export const insertGuestOrderSchema = createInsertSchema(guestOrdersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertGuestOrder = z.infer<typeof insertGuestOrderSchema>;
export type GuestOrder = typeof guestOrdersTable.$inferSelect;

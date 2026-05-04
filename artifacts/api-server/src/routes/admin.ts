import { Router, type IRouter } from "express";
import { eq, sql, count } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { ListAllOrdersQueryParams, UpdateOrderStatusBody, UpdateOrderStatusParams } from "@workspace/api-zod";

const router: IRouter = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = auth.userId;
  next();
};

router.get("/admin/stats", requireAuth, async (_req, res): Promise<void> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalRevenueRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(total), 0)` })
    .from(ordersTable)
    .where(eq(ordersTable.paymentStatus, "paid"));

  const [totalOrdersRow] = await db
    .select({ count: count() })
    .from(ordersTable);

  const [totalCustomersRow] = await db
    .select({ count: sql<number>`COUNT(DISTINCT user_id)` })
    .from(ordersTable);

  const [totalProductsRow] = await db
    .select({ count: count() })
    .from(productsTable);

  const [revenueThisMonthRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(total), 0)` })
    .from(ordersTable)
    .where(
      sql`${ordersTable.paymentStatus} = 'paid' AND ${ordersTable.createdAt} >= ${startOfMonth.toISOString()}`,
    );

  const [ordersThisMonthRow] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(sql`${ordersTable.createdAt} >= ${startOfMonth.toISOString()}`);

  const [pendingOrdersRow] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(eq(ordersTable.status, "pending"));

  const [lowStockRow] = await db
    .select({ count: count() })
    .from(productsTable)
    .where(sql`${productsTable.stock} < 10`);

  res.json({
    totalRevenue: Number(totalRevenueRow.total),
    totalOrders: totalOrdersRow.count,
    totalCustomers: Number(totalCustomersRow.count),
    totalProducts: totalProductsRow.count,
    revenueThisMonth: Number(revenueThisMonthRow.total),
    ordersThisMonth: ordersThisMonthRow.count,
    pendingOrders: pendingOrdersRow.count,
    lowStockProducts: lowStockRow.count,
  });
});

router.get("/admin/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = ListAllOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const conditions = [];
  if (parsed.data.status) {
    conditions.push(eq(ordersTable.status, parsed.data.status));
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(sql`${ordersTable.createdAt} DESC`);

  const result = await Promise.all(
    orders.map(async (order) => {
      const items = await db
        .select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, order.id));
      return {
        ...order,
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        total: Number(order.total),
        paymentMethod: order.paymentMethod ?? null,
        addressLine2: order.addressLine2 ?? null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items: items.map((i) => ({
          ...i,
          price: Number(i.price),
          customName: i.customName ?? null,
          customNumber: i.customNumber ?? null,
        })),
      };
    }),
  );

  res.json(result);
});

router.patch("/admin/orders/:id/status", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id));

  res.json({
    ...order,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    total: Number(order.total),
    paymentMethod: order.paymentMethod ?? null,
    addressLine2: order.addressLine2 ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: items.map((i) => ({
      ...i,
      price: Number(i.price),
      customName: i.customName ?? null,
      customNumber: i.customNumber ?? null,
    })),
  });
});

router.get("/admin/sales-by-team", requireAuth, async (_req, res): Promise<void> => {
  const sales = await db
    .select({
      team: orderItemsTable.team,
      totalSales: sql<string>`COALESCE(SUM(${orderItemsTable.price} * ${orderItemsTable.quantity}), 0)`,
      orderCount: sql<number>`CAST(COUNT(DISTINCT ${orderItemsTable.orderId}) AS INT)`,
    })
    .from(orderItemsTable)
    .groupBy(orderItemsTable.team)
    .orderBy(sql`SUM(${orderItemsTable.price} * ${orderItemsTable.quantity}) DESC`);

  res.json(
    sales.map((s) => ({
      team: s.team,
      totalSales: Number(s.totalSales),
      orderCount: s.orderCount,
    })),
  );
});

export default router;

import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, cartItemsTable, productsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/jwtMiddleware";
import { CreateOrderBody, GetOrderParams, ProcessPaymentBody, ProcessPaymentParams } from "@workspace/api-zod";

const router: IRouter = Router();

function mapOrder(order: any, items: any[]) {
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
}

router.get("/orders", requireAuth, async (req: any, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, req.userId))
    .orderBy(ordersTable.createdAt);

  const result = await Promise.all(
    orders.map(async (order) => {
      const items = await db
        .select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, order.id));
      return mapOrder(order, items);
    }),
  );

  res.json(result);
});

router.post("/orders", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const cartItems = await db
    .select({
      id: cartItemsTable.id,
      productId: cartItemsTable.productId,
      productName: productsTable.name,
      team: productsTable.team,
      size: cartItemsTable.size,
      quantity: cartItemsTable.quantity,
      price: cartItemsTable.price,
      customName: cartItemsTable.customName,
      customNumber: cartItemsTable.customNumber,
    })
    .from(cartItemsTable)
    .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.userId, req.userId));

  if (cartItems.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );
  const total = subtotal + parsed.data.shippingCost;

  const [order] = await db
    .insert(ordersTable)
    .values({
      userId: req.userId,
      status: "pending",
      subtotal: String(subtotal.toFixed(2)),
      shippingCost: String(parsed.data.shippingCost.toFixed(2)),
      total: String(total.toFixed(2)),
      shippingMethod: parsed.data.shippingMethod,
      addressLine1: parsed.data.addressLine1,
      addressLine2: parsed.data.addressLine2 ?? null,
      city: parsed.data.city,
      state: parsed.data.state,
      zipCode: parsed.data.zipCode,
      country: parsed.data.country,
      paymentStatus: "pending",
    })
    .returning();

  const orderItemsData = cartItems.map((item) => ({
    orderId: order.id,
    productId: item.productId,
    productName: item.productName ?? "Unknown",
    team: item.team ?? "Unknown",
    size: item.size,
    quantity: item.quantity,
    price: item.price,
    customName: item.customName ?? null,
    customNumber: item.customNumber ?? null,
  }));

  const items = await db.insert(orderItemsTable).values(orderItemsData).returning();

  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, req.userId));

  res.status(201).json(mapOrder(order, items));
});

router.get("/orders/:id", requireAuth, async (req: any, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.id, params.data.id),
        eq(ordersTable.userId, req.userId),
      ),
    );

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id));

  res.json(mapOrder(order, items));
});

router.post("/orders/:id/payment", requireAuth, async (req: any, res): Promise<void> => {
  const params = ProcessPaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ProcessPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.id, params.data.id),
        eq(ordersTable.userId, req.userId),
      ),
    );

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  await db
    .update(ordersTable)
    .set({
      status: "processing",
      paymentStatus: "paid",
      paymentMethod: parsed.data.paymentMethod,
      transactionId,
    })
    .where(eq(ordersTable.id, order.id));

  res.json({
    success: true,
    transactionId,
    message: "Pagamento processado com sucesso",
    orderId: order.id,
    status: "processing",
  });
});

export default router;

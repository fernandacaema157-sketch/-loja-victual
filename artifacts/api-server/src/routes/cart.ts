import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, cartItemsTable, productsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/jwtMiddleware";
import {
  AddCartItemBody,
  UpdateCartItemBody,
  UpdateCartItemParams,
  RemoveCartItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildCart(userId: string) {
  const items = await db
    .select({
      id: cartItemsTable.id,
      productId: cartItemsTable.productId,
      productName: productsTable.name,
      productImageUrl: productsTable.imageUrl,
      team: productsTable.team,
      size: cartItemsTable.size,
      quantity: cartItemsTable.quantity,
      price: cartItemsTable.price,
      customName: cartItemsTable.customName,
      customNumber: cartItemsTable.customNumber,
    })
    .from(cartItemsTable)
    .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.userId, userId));

  const mappedItems = items.map((i) => ({
    ...i,
    productName: i.productName ?? "Unknown",
    productImageUrl: i.productImageUrl ?? null,
    team: i.team ?? "Unknown",
    price: Number(i.price),
    customName: i.customName ?? null,
    customNumber: i.customNumber ?? null,
  }));

  const subtotal = mappedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const itemCount = mappedItems.reduce((sum, item) => sum + item.quantity, 0);

  return { items: mappedItems, subtotal, itemCount };
}

router.get("/cart", requireAuth, async (req: any, res): Promise<void> => {
  const cart = await buildCart(req.userId);
  res.json(cart);
});

router.post("/cart/items", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = AddCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, parsed.data.productId));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  if (product.stock < parsed.data.quantity) {
    res.status(400).json({ error: "Insufficient stock" });
    return;
  }

  const [existing] = await db
    .select()
    .from(cartItemsTable)
    .where(
      and(
        eq(cartItemsTable.userId, req.userId),
        eq(cartItemsTable.productId, parsed.data.productId),
        eq(cartItemsTable.size, parsed.data.size),
      ),
    );

  if (existing) {
    await db
      .update(cartItemsTable)
      .set({ quantity: existing.quantity + parsed.data.quantity })
      .where(eq(cartItemsTable.id, existing.id));
  } else {
    await db.insert(cartItemsTable).values({
      userId: req.userId,
      productId: parsed.data.productId,
      size: parsed.data.size,
      quantity: parsed.data.quantity,
      price: product.price,
      customName: parsed.data.customName ?? null,
      customNumber: parsed.data.customNumber ?? null,
    });
  }

  const cart = await buildCart(req.userId);
  res.status(201).json(cart);
});

router.patch(
  "/cart/items/:itemId",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = UpdateCartItemParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateCartItemBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [item] = await db
      .select()
      .from(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.id, params.data.itemId),
          eq(cartItemsTable.userId, req.userId),
        ),
      );

    if (!item) {
      res.status(404).json({ error: "Cart item not found" });
      return;
    }

    if (parsed.data.quantity <= 0) {
      await db
        .delete(cartItemsTable)
        .where(eq(cartItemsTable.id, params.data.itemId));
    } else {
      await db
        .update(cartItemsTable)
        .set({ quantity: parsed.data.quantity })
        .where(eq(cartItemsTable.id, params.data.itemId));
    }

    const cart = await buildCart(req.userId);
    res.json(cart);
  },
);

router.delete(
  "/cart/items/:itemId",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const params = RemoveCartItemParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    await db
      .delete(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.id, params.data.itemId),
          eq(cartItemsTable.userId, req.userId),
        ),
      );

    const cart = await buildCart(req.userId);
    res.json(cart);
  },
);

router.delete("/cart/clear", requireAuth, async (req: any, res): Promise<void> => {
  await db
    .delete(cartItemsTable)
    .where(eq(cartItemsTable.userId, req.userId));

  res.json({ items: [], subtotal: 0, itemCount: 0 });
});

router.post("/cart/shipping", async (req, res): Promise<void> => {
  const { zipCode } = req.body;
  if (!zipCode) {
    res.status(400).json({ error: "zipCode is required" });
    return;
  }

  const options = [
    {
      id: "standard",
      name: "Entrega Padrão",
      price: 19.9,
      estimatedDays: "7-10 dias úteis",
    },
    {
      id: "express",
      name: "Entrega Expressa",
      price: 39.9,
      estimatedDays: "3-5 dias úteis",
    },
    {
      id: "overnight",
      name: "Entrega no Dia Seguinte",
      price: 79.9,
      estimatedDays: "1-2 dias úteis",
    },
  ];

  res.json({ options });
});

export default router;

import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, guestOrdersTable } from "@workspace/db";

const router: IRouter = Router();

type GuestOrderItemInput = {
  productId?: number;
  productName: string;
  team: string;
  size: string;
  quantity: number;
  price: number;
  customName?: string;
  customNumber?: string;
};

function validateBody(body: unknown): { guestName: string; whatsapp: string; items: GuestOrderItemInput[]; notes?: string } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  if (typeof b.guestName !== "string" || b.guestName.trim().length < 1) return null;
  if (typeof b.whatsapp !== "string" || b.whatsapp.trim().length < 10) return null;
  if (!Array.isArray(b.items) || b.items.length === 0) return null;

  for (const item of b.items) {
    if (!item || typeof item !== "object") return null;
    const i = item as Record<string, unknown>;
    if (typeof i.productName !== "string" || !i.productName) return null;
    if (typeof i.team !== "string" || !i.team) return null;
    if (typeof i.size !== "string" || !i.size) return null;
    if (typeof i.quantity !== "number" || i.quantity < 1) return null;
    if (typeof i.price !== "number" || i.price < 0) return null;
  }

  return {
    guestName: String(b.guestName).trim(),
    whatsapp:  String(b.whatsapp).replace(/\D/g, ""),
    items:     b.items as GuestOrderItemInput[],
    notes:     typeof b.notes === "string" ? b.notes.trim() : undefined,
  };
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  return `G${timestamp}${rand}`;
}

router.post("/guest-orders", async (req, res): Promise<void> => {
  const data = validateBody(req.body);
  if (!data) {
    res.status(400).json({ error: "Dados inválidos. Verifique nome, WhatsApp e itens." });
    return;
  }

  const { guestName, whatsapp, items, notes } = data;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total    = subtotal;

  let orderNumber = generateOrderNumber();
  let attempts    = 0;

  while (attempts < 5) {
    try {
      const [order] = await db
        .insert(guestOrdersTable)
        .values({
          orderNumber,
          guestName,
          whatsapp,
          items,
          subtotal: subtotal.toFixed(2),
          total:    total.toFixed(2),
          status:   "pending",
          notes:    notes ?? null,
        })
        .returning();

      res.status(201).json({
        id:          order.id,
        orderNumber: order.orderNumber,
        guestName:   order.guestName,
        whatsapp:    order.whatsapp,
        items:       order.items,
        subtotal:    Number(order.subtotal),
        total:       Number(order.total),
        status:      order.status,
        createdAt:   order.createdAt.toISOString(),
      });
      return;
    } catch (err: any) {
      if (err?.code === "23505") {
        orderNumber = generateOrderNumber();
        attempts++;
      } else {
        throw err;
      }
    }
  }

  res.status(500).json({ error: "Falha ao gerar número de pedido" });
});

router.get("/guest-orders/:orderNumber", async (req, res): Promise<void> => {
  const { orderNumber } = req.params;

  const [order] = await db
    .select()
    .from(guestOrdersTable)
    .where(eq(guestOrdersTable.orderNumber, orderNumber));

  if (!order) {
    res.status(404).json({ error: "Pedido não encontrado" });
    return;
  }

  res.json({
    id:          order.id,
    orderNumber: order.orderNumber,
    guestName:   order.guestName,
    items:       order.items,
    subtotal:    Number(order.subtotal),
    total:       Number(order.total),
    status:      order.status,
    createdAt:   order.createdAt.toISOString(),
  });
});

export default router;

import { Router, type IRouter } from "express";
import { eq, ilike, and, gte, lte, sql } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/jwtMiddleware";
import {
  ListProductsQueryParams,
  CreateProductBody,
  UpdateProductBody,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, team, minPrice, maxPrice } = parsed.data;
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const conditions = [];
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
  if (team) conditions.push(eq(productsTable.team, team));
  if (minPrice !== undefined) conditions.push(gte(productsTable.price, String(minPrice)));
  if (maxPrice !== undefined) conditions.push(lte(productsTable.price, String(maxPrice)));

  const offset = (page - 1) * limit;

  const products = await db
    .select()
    .from(productsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(productsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json({
    products: products.map((p) => ({
      ...p,
      price: Number(p.price),
      createdAt: p.createdAt.toISOString(),
    })),
    total: Number(count),
    page,
    limit,
  });
});

router.get("/products/featured", async (_req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.isFeatured, true))
    .limit(6);

  res.json(
    products.map((p) => ({
      ...p,
      price: Number(p.price),
      createdAt: p.createdAt.toISOString(),
    })),
  );
});

router.get("/products/teams", async (_req, res): Promise<void> => {
  const teams = await db
    .selectDistinct({ team: productsTable.team })
    .from(productsTable)
    .orderBy(productsTable.team);

  res.json(teams.map((t) => t.team));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const parsed = GetProductParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, parsed.data.id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({ ...product, price: Number(product.price), createdAt: product.createdAt.toISOString() });
});

router.post("/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({
      ...parsed.data,
      price: String(parsed.data.price),
      isFeatured: parsed.data.isFeatured ?? false,
      allowCustomization: parsed.data.allowCustomization ?? true,
    })
    .returning();

  res.status(201).json({ ...product, price: Number(product.price), createdAt: product.createdAt.toISOString() });
});

router.patch("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price !== undefined) {
    updateData.price = String(parsed.data.price);
  }

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({ ...product, price: Number(product.price), createdAt: product.createdAt.toISOString() });
});

router.delete("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({ success: true });
});

export default router;

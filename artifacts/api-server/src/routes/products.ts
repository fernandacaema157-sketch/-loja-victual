import { Router, type IRouter } from "express";
import { eq, ilike, and, gte, lte, sql } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
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

  const { team, size, minPrice, maxPrice, search, inStock } = parsed.data;
  const conditions = [];

  if (team) conditions.push(eq(productsTable.team, team));
  if (minPrice !== undefined)
    conditions.push(gte(productsTable.price, String(minPrice)));
  if (maxPrice !== undefined)
    conditions.push(lte(productsTable.price, String(maxPrice)));
  if (search)
    conditions.push(
      ilike(productsTable.name, `%${search}%`),
    );
  if (inStock) conditions.push(gte(productsTable.stock, 1));
  if (size) {
    conditions.push(sql`${productsTable.sizes} @> ARRAY[${size}]::text[]`);
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(productsTable.createdAt);

  const mapped = products.map((p) => ({
    ...p,
    price: Number(p.price),
    isFeatured: p.isFeatured,
    allowCustomization: p.allowCustomization,
    createdAt: p.createdAt.toISOString(),
  }));
  res.json(mapped);
});

router.get("/products/featured", async (_req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.isFeatured, true))
    .limit(6);

  const mapped = products.map((p) => ({
    ...p,
    price: Number(p.price),
    createdAt: p.createdAt.toISOString(),
  }));
  res.json(mapped);
});

router.get("/products/teams", async (_req, res): Promise<void> => {
  const teams = await db
    .select({
      team: productsTable.team,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(productsTable)
    .groupBy(productsTable.team)
    .orderBy(productsTable.team);

  res.json(teams.map((t) => ({ name: t.team, count: t.count })));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({ ...product, price: Number(product.price), createdAt: product.createdAt.toISOString() });
});

router.post("/products", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

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

router.patch("/products/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

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

router.delete("/products/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

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

  res.sendStatus(204);
});

export default router;

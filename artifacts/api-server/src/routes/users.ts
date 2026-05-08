import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

router.post("/users/sync", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { email, firstName, lastName } = req.body as {
    email: string;
    firstName?: string;
    lastName?: string;
  };

  if (!email) {
    res.status(400).json({ error: "email required" });
    return;
  }

  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, auth.userId));

  if (existing) {
    const [updated] = await db
      .update(usersTable)
      .set({ email, firstName: firstName ?? null, lastName: lastName ?? null, isAdmin })
      .where(eq(usersTable.clerkId, auth.userId))
      .returning();
    res.json({ id: updated.id, clerkId: updated.clerkId, email: updated.email, isAdmin: updated.isAdmin });
    return;
  }

  const [created] = await db
    .insert(usersTable)
    .values({ clerkId: auth.userId, email, firstName: firstName ?? null, lastName: lastName ?? null, isAdmin })
    .returning();

  res.status(201).json({ id: created.id, clerkId: created.clerkId, email: created.email, isAdmin: created.isAdmin });
});

router.get("/users/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, auth.userId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ id: user.id, clerkId: user.clerkId, email: user.email, firstName: user.firstName, lastName: user.lastName, isAdmin: user.isAdmin });
});

export default router;

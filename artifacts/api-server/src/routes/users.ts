import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/jwtMiddleware";

const router: IRouter = Router();

router.get("/users/me", requireAuth, async (req: any, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userIdNum));

  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isAdmin: user.isAdmin,
  });
});

export default router;

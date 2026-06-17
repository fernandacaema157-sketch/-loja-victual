import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { signToken, requireAuth } from "../middlewares/jwtMiddleware";

const router: IRouter = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, firstName, lastName } = req.body as {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "E-mail e senha são obrigatórios" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" });
    return;
  }

  const emailNorm = email.trim().toLowerCase();

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, emailNorm));

  if (existing) {
    res.status(409).json({ error: "Este e-mail já está cadastrado" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const isAdmin = ADMIN_EMAILS.includes(emailNorm);

  const [user] = await db
    .insert(usersTable)
    .values({
      email: emailNorm,
      passwordHash,
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      isAdmin,
    })
    .returning();

  const token = signToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin });

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
    },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "E-mail e senha são obrigatórios" });
    return;
  }

  const emailNorm = email.trim().toLowerCase();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, emailNorm));

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "E-mail ou senha incorretos" });
    return;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ error: "E-mail ou senha incorretos" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
    },
  });
});

router.get("/auth/me", requireAuth, async (req: any, res): Promise<void> => {
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

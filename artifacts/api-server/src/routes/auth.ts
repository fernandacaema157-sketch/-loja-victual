import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { signToken, requireAuth, type JwtPayload } from "../middlewares/jwtMiddleware";

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
    res.status(400).json({ error: "Email e senha são obrigatórios" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres" });
    return;
  }

  const emailLower = email.trim().toLowerCase();

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, emailLower));

  if (existing) {
    res.status(409).json({ error: "Este email já está cadastrado" });
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const isAdmin = ADMIN_EMAILS.includes(emailLower);

  const [user] = await db
    .insert(usersTable)
    .values({
      clerkId: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      email: emailLower,
      password: hashed,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
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
    res.status(400).json({ error: "Email e senha são obrigatórios" });
    return;
  }

  const emailLower = email.trim().toLowerCase();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, emailLower));

  if (!user || !user.password) {
    res.status(401).json({ error: "Email ou senha incorretos" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Email ou senha incorretos" });
    return;
  }

  const isAdmin = user.isAdmin || ADMIN_EMAILS.includes(emailLower);

  if (isAdmin !== user.isAdmin) {
    await db.update(usersTable).set({ isAdmin }).where(eq(usersTable.id, user.id));
  }

  const token = signToken({ userId: user.id, email: user.email, isAdmin });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin,
    },
  });
});

router.get("/auth/me", requireAuth, async (req: any, res): Promise<void> => {
  const payload = req.jwtPayload as JwtPayload;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, payload.userId));

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

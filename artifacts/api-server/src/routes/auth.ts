import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import https from "https";
import crypto from "crypto";
import { db, usersTable } from "@workspace/db";
import { signToken, requireAuth } from "../middlewares/jwtMiddleware";
import { sendPasswordResetEmail } from "../utils/mailer";

const router: IRouter = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";

// Callback URL must match what's registered in Google Cloud Console
function getGoogleCallbackUrl(req: any): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  const host  = req.headers["x-forwarded-host"] || req.get("host");
  return `${proto}://${host}/api/auth/google/callback`;
}

// ── REGISTER ──────────────────────────────────────────────────

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

// ── LOGIN ────────────────────────────────────────────────────

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

// ── ME ───────────────────────────────────────────────────────

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

// ── UPDATE PROFILE ───────────────────────────────────────────

router.put("/auth/profile", requireAuth, async (req: any, res): Promise<void> => {
  const { firstName, lastName } = req.body as { firstName?: string; lastName?: string };

  const [user] = await db
    .update(usersTable)
    .set({
      firstName: firstName?.trim() || null,
      lastName:  lastName?.trim()  || null,
    })
    .where(eq(usersTable.id, req.userIdNum))
    .returning();

  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName:  user.lastName,
    isAdmin:   user.isAdmin,
  });
});

// ── CHANGE PASSWORD ──────────────────────────────────────────

router.put("/auth/change-password", requireAuth, async (req: any, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Senha atual e nova senha são obrigatórias" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "Nova senha deve ter pelo menos 6 caracteres" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userIdNum));

  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  // Google-only accounts have no password
  if (!user.passwordHash) {
    res.status(400).json({ error: "Esta conta usa login com Google. Use 'Esqueceu a senha?' para definir uma senha." });
    return;
  }

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) {
    res.status(401).json({ error: "Senha atual incorreta" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(usersTable)
    .set({ passwordHash })
    .where(eq(usersTable.id, user.id));

  res.json({ message: "Senha alterada com sucesso" });
});

// ── FORGOT PASSWORD ──────────────────────────────────────────

router.post("/auth/forgot-password", async (req: any, res): Promise<void> => {
  const { email } = req.body as { email?: string };

  if (!email) {
    res.status(400).json({ error: "E-mail é obrigatório" });
    return;
  }

  const emailNorm = email.trim().toLowerCase();

  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.email, emailNorm));

  // Always respond 200 to avoid user enumeration
  if (!user) {
    res.json({ message: "Se este e-mail estiver cadastrado, você receberá um link em breve." });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await db
    .update(usersTable)
    .set({ resetToken: token, resetTokenExpiry: expiry })
    .where(eq(usersTable.id, user.id));

  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  const host  = req.headers["x-forwarded-host"] || req.get("host");
  const resetUrl = `${proto}://${host}/#reset-password?token=${token}`;

  await sendPasswordResetEmail(user.email, resetUrl, req.log);

  res.json({ message: "Se este e-mail estiver cadastrado, você receberá um link em breve." });
});

// ── RESET PASSWORD ────────────────────────────────────────────

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, password } = req.body as { token?: string; password?: string };

  if (!token || !password) {
    res.status(400).json({ error: "Token e senha são obrigatórios" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" });
    return;
  }

  const now = new Date();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.resetToken, token),
        gt(usersTable.resetTokenExpiry!, now),
      ),
    );

  if (!user) {
    res.status(400).json({ error: "Link inválido ou expirado. Solicite um novo." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .update(usersTable)
    .set({ passwordHash, resetToken: null, resetTokenExpiry: null })
    .where(eq(usersTable.id, user.id));

  const jwtToken = signToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin });

  res.json({
    token: jwtToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
    },
  });
});

// ── GOOGLE OAUTH ─────────────────────────────────────────────

// Debug: see exactly which callback URL is being used
router.get("/auth/google/debug", (req: any, res): void => {
  const callbackUrl = getGoogleCallbackUrl(req);
  res.json({ callbackUrl, clientIdSet: !!GOOGLE_CLIENT_ID, clientSecretSet: !!GOOGLE_CLIENT_SECRET });
});

router.get("/auth/google", (req: any, res): void => {
  if (!GOOGLE_CLIENT_ID) {
    res.status(500).json({ error: "Google OAuth não configurado" });
    return;
  }
  const callbackUrl = getGoogleCallbackUrl(req);
  req.log.info({ callbackUrl }, "Google OAuth redirect");
  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  callbackUrl,
    response_type: "code",
    scope:         "openid email profile",
    access_type:   "offline",
    prompt:        "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get("/auth/google/callback", async (req: any, res): Promise<void> => {
  const { code, error, error_description } = req.query as {
    code?: string;
    error?: string;
    error_description?: string;
  };

  req.log.info({ code: !!code, error, error_description }, "Google OAuth callback received");

  if (error || !code) {
    req.log.warn({ error, error_description }, "Google OAuth denied/cancelled");
    res.redirect(`/#sign-in?error=${encodeURIComponent(error || 'google_cancelled')}`);
    return;
  }

  try {
    const callbackUrl = getGoogleCallbackUrl(req);

    // Exchange code for tokens
    const tokenRes = await httpPost("https://oauth2.googleapis.com/token", {
      code,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri:  callbackUrl,
      grant_type:    "authorization_code",
    });

    const { access_token, error: tokenError, error_description: tokenDesc } = tokenRes as any;
    if (!access_token) {
      req.log.error({ tokenError, tokenDesc, tokenRes }, "Google token exchange failed");
      res.redirect("/#sign-in?error=google_token");
      return;
    }

    // Fetch user info from Google
    const profile = await httpGet(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`,
    ) as any;

    const email = profile.email?.toLowerCase();
    if (!email) {
      res.redirect("/#sign-in?error=google_no_email");
      return;
    }

    // Find or create user
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    let user = existing;
    if (!user) {
      const isAdmin = ADMIN_EMAILS.includes(email);
      const [created] = await db
        .insert(usersTable)
        .values({
          email,
          passwordHash: null,
          firstName: profile.given_name || null,
          lastName:  profile.family_name || null,
          isAdmin,
        })
        .returning();
      user = created;
    }

    const token = signToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin });

    // Redirect back to SPA with token
    res.redirect(`/#oauth-callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    res.redirect("/#sign-in?error=google_failed");
  }
});

// ── HELPERS ──────────────────────────────────────────────────

function httpPost(url: string, body: Record<string, string>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const payload = new URLSearchParams(body).toString();
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path: u.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(payload),
      },
    };
    const req = https.request(options, (r) => {
      let data = "";
      r.on("data", (c) => { data += c; });
      r.on("end", () => {
        try { resolve(JSON.parse(data)); } catch { reject(new Error("Invalid JSON")); }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function httpGet(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    https.get(url, (r) => {
      let data = "";
      r.on("data", (c) => { data += c; });
      r.on("end", () => {
        try { resolve(JSON.parse(data)); } catch { reject(new Error("Invalid JSON")); }
      });
    }).on("error", reject);
  });
}

export default router;

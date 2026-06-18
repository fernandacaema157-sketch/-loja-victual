import nodemailer from "nodemailer";

const SMTP_HOST = process.env.EMAIL_SMTP_HOST ?? "";
const SMTP_PORT = parseInt(process.env.EMAIL_SMTP_PORT ?? "587", 10);
const SMTP_USER = process.env.EMAIL_SMTP_USER ?? "";
const SMTP_PASS = process.env.EMAIL_SMTP_PASS ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? `JerseyStore <noreply@jerseystore.com>`;

function isConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function createTransport() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  logger: any,
): Promise<void> {
  if (!isConfigured()) {
    logger.warn({ resetUrl }, "E-mail SMTP não configurado — link de reset logado aqui para dev");
    return;
  }

  const transport = createTransport();

  await transport.sendMail({
    from: EMAIL_FROM,
    to,
    subject: "Redefinição de senha — JerseyStore",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#00ff88">JerseyStore</h2>
        <p>Recebemos um pedido para redefinir a senha da sua conta.</p>
        <p>Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
        <p style="margin:2rem 0">
          <a href="${resetUrl}"
             style="background:#00ff88;color:#000;padding:.8rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:700">
            Redefinir minha senha
          </a>
        </p>
        <p style="color:#888;font-size:.85rem">Se você não solicitou isso, ignore este e-mail.</p>
        <p style="color:#888;font-size:.85rem">Ou copie e cole este link no navegador:<br>${resetUrl}</p>
      </div>
    `,
    text: `Acesse o link para redefinir sua senha (expira em 1 hora):\n\n${resetUrl}\n\nSe não foi você, ignore este e-mail.`,
  });
}

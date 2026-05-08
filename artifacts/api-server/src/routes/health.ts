import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/debug/auth", (req, res) => {
  const auth = getAuth(req);
  res.json({
    userId: auth?.userId ?? null,
    hasAuthHeader: !!req.headers.authorization,
    authHeader: req.headers.authorization ? req.headers.authorization.substring(0, 30) + "..." : null,
    host: req.headers.host,
    env: {
      hasSecretKey: !!process.env.CLERK_SECRET_KEY,
      hasPublishableKey: !!process.env.CLERK_PUBLISHABLE_KEY,
      publishableKeyPrefix: process.env.CLERK_PUBLISHABLE_KEY?.substring(0, 20),
    },
  });
});

export default router;

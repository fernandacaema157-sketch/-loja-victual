import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Muitas tentativas. Tente novamente mais tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", authRateLimit);
app.use("/api/auth/register", authRateLimit);

app.use("/api", router);

export default app;

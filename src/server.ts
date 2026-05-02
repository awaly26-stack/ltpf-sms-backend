import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // =========================
  // MIDDLEWARES GLOBAUX
  // =========================
  app.use(cors());
  app.use(express.json());

  // =========================
  // API KEY SECURITY
  // =========================
  const API_KEY = process.env.INTERNAL_API_KEY;

  const verifyApiKey = (req: any, res: any, next: any) => {
    const clientKey = req.headers["x-api-key"];

    if (!API_KEY) {
      console.error("❌ INTERNAL_API_KEY missing in .env");
      return res.status(500).json({ error: "Server misconfigured" });
    }

    if (clientKey !== API_KEY) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    next();
  };

  // =========================
  // HEALTH CHECK (PUBLIC)
  // =========================
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "LTPF SMS Proxy" });
  });

  // =========================
  // ORANGE TOKEN CACHE
  // =========================
  let orangeTokenCache: { token: string; expiresAt: number } | null = null;

  async function getOrangeToken(): Promise<string | null> {
    const now = Date.now();

    if (orangeTokenCache && orangeTokenCache.expiresAt > now) {
      return orangeTokenCache.token;
    }

    const clientId = process.env.ORANGE_CLIENT_ID;
    const clientSecret = process.env.ORANGE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("❌ Orange credentials missing");
      return null;
    }

    try {
      const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

      const response = await fetch("https://api.orange.com/oauth/v3/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: "grant_type=client_credentials",
      });

      if (!response.ok) {
        console.error("❌ TOKEN ERROR:", await response.text());
        return null;
      }

      const data = await response.json();

      orangeTokenCache = {
        token: data.access_token,
        expiresAt: now + (data.expires_in - 60) * 1000,
      };

      return data.access_token;
    } catch (err) {
      console.error("❌ Token error:", err);
      return null;
    }
  }

  // =========================
  // SMS ROUTE (PROTÉGÉE)
  // =========================
  app.post("/api/orange/sms", verifyApiKey, async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: "Missing data" });
    }

    const token = await getOrangeToken();
    if (!token) {
      return res.status(503).json({ error: "Orange unavailable" });
    }

    const cleanTo = to.replace(/[^0-9]/g, "").slice(-9);
    const formattedTo = `tel:+221${cleanTo}`;

    const senderAddress = "tel:+221777154775";
    const senderName = "LTPFatick";
    const encodedSender = encodeURIComponent(senderAddress);

    const orangeUrl =
      `https://api.orange.com/smsmessaging/v1/outbound/${encodedSender}/requests`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(orangeUrl, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          outboundSMSMessageRequest: {
            address: formattedTo,
            senderAddress,
            senderName,
            outboundSMSTextMessage: { message },
          },
        }),
      });

      clearTimeout(timeout);

      const text = await response.text();
      let result;

      try {
        result = JSON.parse(text);
      } catch {
        result = text;
      }

      if (response.ok) {
        return res.json({ success: true, result });
      }

      return res.status(response.status).json({
        success: false,
        error: result,
      });

    } catch (error: any) {
      clearTimeout(timeout);

      if (error.name === "AbortError") {
        return res.status(504).json({ error: "Orange timeout (20s)" });
      }

      return res.status(500).json({ error: "Server error" });
    }
  });

  // =========================
  // FRONTEND (PROD / DEV)
  // =========================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // =========================
  // START SERVER
  // =========================
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();
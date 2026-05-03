import admin from "firebase-admin";
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
  // 🔐 FIREBASE ADMIN INIT
  // =========================
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }

  // =========================
  // MIDDLEWARES GLOBAUX
  // =========================
  app.use(cors());
  app.use(express.json());

  // =========================
  // 🔐 FIREBASE AUTH MIDDLEWARE
  // =========================
  const verifyFirebaseToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split("Bearer ")[1];

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded; // 🔥 user accessible après
      next();
    } catch (error) {
      console.error("❌ Invalid token:", error);
      return res.status(401).json({ error: "Unauthorized" });
    }
  };

  // =========================
  // HEALTH CHECK
  // =========================

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "LTPF SMS Proxy" });
  });
  
     // =========================
  // ROUTE SUPER_ADMIN_COD
  // =========================
  app.post("/api/auth/super-admin", (req, res) => {
  const { code } = req.body;

  const SUPER_ADMIN_CODE = process.env.SUPER_ADMIN_CODE;

  if (!SUPER_ADMIN_CODE) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  if (code === SUPER_ADMIN_CODE) {
    return res.json({ success: true });
  }

  return res.status(403).json({ success: false });
});

   // =========================
  // ROUTE GEMINI AI
  // =========================
  apiRouter.post("/ai/summarize", verifyFirebaseToken, async (req: any, res: any) => {
  const { prompt } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({ error: "Gemini API Key missing on server" });
  }

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    // 🔐 OPTIONNEL : contrôle rôle utilisateur
    const userDoc = await admin.firestore()
      .collection("users")
      .doc(req.user.uid)
      .get();

    const role = userDoc.data()?.role;

    // 👉 seuls élèves + staff autorisés (ajuste selon ton besoin)
    if (!role) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { GoogleGenAI } = await import("@google/genai");
    const genAI = new GoogleGenAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.json({ text });

  } catch (error: any) {
    console.error("❌ Gemini Error:", error);
    return res.status(500).json({
      error: "IA error",
      details: error.message
    });
  }
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
  // 🔐 SMS ROUTE SÉCURISÉE
  // =========================
  app.post("/api/orange/sms", verifyFirebaseToken, async (req: any, res: any) => {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: "Missing data" });
    }

    // 🔥 (OPTIONNEL MAIS RECOMMANDÉ) vérifier rôle
    const userDoc = await admin.firestore()
      .collection("users")
      .doc(req.user.uid)
      .get();

    const role = userDoc.data()?.role;

    if (role !== "ADMIN" && role !== "SURVEILLANT") {
      return res.status(403).json({ error: "Access denied" });
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
  const distPath = path.join(process.cwd(), "dist");

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));

    app.use((req, res, next) => {
      if (req.method !== "GET") return next();
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
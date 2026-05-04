import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";

// =========================
// INIT APP
// =========================
const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// ROUTER API CENTRAL
// =========================
const apiRouter = express.Router();
app.use("/api", apiRouter);

// =========================
// FIREBASE ADMIN INIT
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
// MIDDLEWARES
// =========================
app.use(cors());
app.use(express.json());

// =========================
// AUTH MIDDLEWARE
// =========================
const verifyFirebaseToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const token = authHeader.split("Bearer ")[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// =========================
// HEALTH
// =========================
apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// =========================
// SUPER ADMIN
// =========================
apiRouter.post("/auth/super-admin", (req, res) => {
  const { code } = req.body;

  if (!process.env.SUPER_ADMIN_CODE) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  if (code === process.env.SUPER_ADMIN_CODE) {
    return res.json({ success: true });
  }

  return res.status(403).json({ success: false });
});

// =========================
// GEMINI AI
// =========================
apiRouter.post("/ai/summarize", verifyFirebaseToken, async (req: any, res: any) => {
  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(503).json({ error: "Missing API key" });
  if (!prompt) return res.status(400).json({ error: "Prompt required" });
  if (prompt.length > 2000) return res.status(400).json({ error: "Prompt too long" });

  try {
    const userDoc = await admin.firestore()
      .collection("users")
      .doc(req.user.uid)
      .get();

    const role = userDoc.data()?.role;
    if (!role) return res.status(403).json({ error: "Access denied" });

    const { GoogleGenAI } = await import("@google/genai");

    const genAI = new GoogleGenAI({ apiKey });

    const response = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    return res.json({ text: response.text });

  } catch (error: any) {
    return res.status(500).json({
      error: "AI error",
      details: error.message,
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

  if (!clientId || !clientSecret) return null;

  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch("https://api.orange.com/oauth/v3/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const data = await response.json();

    orangeTokenCache = {
      token: data.access_token,
      expiresAt: now + (data.expires_in - 60) * 1000,
    };

    return data.access_token;

  } catch {
    return null;
  }
}

// =========================
// SMS ORANGE
// =========================
apiRouter.post("/orange/sms", verifyFirebaseToken, async (req: any, res: any) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: "Missing data" });
  }

  const userDoc = await admin.firestore()
    .collection("users")
    .doc(req.user.uid)
    .get();

  const role = userDoc.data()?.role;

  if (role !== "ADMIN" && role !== "SURVEILLANT") {
    return res.status(403).json({ error: "Access denied" });
  }

  const token = await getOrangeToken();
  if (!token) return res.status(503).json({ error: "Orange unavailable" });

  const cleanTo = to.replace(/[^0-9]/g, "").slice(-9);
  const formattedTo = `tel:+221${cleanTo}`;

  try {
    const response = await fetch(
      `https://api.orange.com/smsmessaging/v1/outbound/tel%3A%2B221777154775/requests`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          outboundSMSMessageRequest: {
            address: formattedTo,
            senderAddress: "tel:+221777154775",
            senderName: "LTPFatick",
            outboundSMSTextMessage: { message },
          },
        }),
      }
    );

    const data = await response.json();

    return res.json({ success: true, data });

  } catch {
    return res.status(500).json({ error: "SMS failed" });
  }
});

// =========================
// FRONTEND
// =========================
const distPath = path.join(process.cwd(), "dist");

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on ${PORT}`);
  });
}

startServer();
import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";


// =========================
// INIT
// =========================
const app = express();
const PORT = 3000;

// =========================
// FIREBASE ADMIN
// =========================
try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      console.log("✅ Firebase Admin initialized successfully");
    } else {
      console.warn("⚠️ Firebase Admin credentials missing. Custom tokens won't work.");
    }
  }
} catch (error) {
  console.error("❌ Firebase Admin init failed:", error);
}

// =========================
// MIDDLEWARES
// =========================
app.use(cors({
  origin: [
    "https://ltpf-edupro.web.app",
    "http://localhost:3000",
    "http://localhost:5173",
    
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.options(/.*/, cors());
app.use(express.json());

// =========================
// API ROUTER
// =========================
const apiRouter = express.Router();
app.use("/api", apiRouter);

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
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// =========================
// HEALTH CHECK
// =========================
apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// =========================


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

apiRouter.post("/auth/login", async (req, res) => {
  const { matricule, code } = req.body;

  try {

    // =========================
    // 🔐 SUPER ADMIN
    // =========================
    if (
      code &&
      process.env.SUPER_ADMIN_CODE &&
      code.trim().toUpperCase() === process.env.SUPER_ADMIN_CODE.trim().toUpperCase()
    ) {
      console.log("LOGGING AS SUPER ADMIN");
      const uid = "admin_ltpf";
      const permissions = ["ALL"];
      const token = await admin.auth().createCustomToken(uid, {
        role: "ADMIN",
        permissions,
      });

      return res.json({
        token,
        uid,
        name: "ADMIN LTP",
        role: "ADMIN",
        permissions,
      });
    }

    // =========================
    // 🎓 LOGIN PAR MATRICULE
    // =========================
    if (!matricule) {
      return res.status(400).json({
        error: "Matricule requis",
      });
    }

    // =========================
    // NORMALISATION
    // =========================
    const normalizedMatricule = matricule.trim().toUpperCase();
    console.log("LOGIN ATTEMPT FOR MATRICULE:", normalizedMatricule);

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
      console.error("CRITICAL: Missing Firebase Admin Config in ENV (PROJECT_ID or PRIVATE_KEY)");
      return res.status(500).json({ error: "Configuration serveur incomplète (Firebase Admin missing)" });
    }

    // =========================
    // 🔍 RECHERCHE STAFF
    // =========================
    console.log("SEARCHING IN USERS COLLECTION...");
    let snap = await admin
      .firestore()
      .collection("users")
      .where("matricule", "==", normalizedMatricule)
      .limit(1)
      .get();

    let userData: any = null;
    let role = "ELEVE";

    // =========================
    // 👨‍🏫 STAFF TROUVÉ
    // =========================
    if (!snap.empty) {
      const doc = snap.docs[0];
      userData = {
        id: doc.id,
        ...doc.data(),
      };
      role = userData.role || "SURVEILLANT";
      console.log("STAFF MATCH FOUND:", userData.id, "ROLE:", role);
    } else {
      // =========================
      // 🎓 RECHERCHE ÉLÈVE
      // =========================
      console.log("STAFF NOT FOUND, SEARCHING IN STUDENTS...");
      snap = await admin
        .firestore()
        .collection("students")
        .where("matricule", "==", normalizedMatricule)
        .limit(1)
        .get();

      console.log("STUDENT MATCHES FOUND:", snap.size);

      if (snap.empty) {
        console.warn("NO MATCH FOUND FOR MATRICULE:", normalizedMatricule);
        return res.status(404).json({
          error: "Matricule introuvable dans la base de données (Silicon Campus Fatick)",
        });
      }

      const doc = snap.docs[0];

      const data = doc.data();

      console.log("STUDENT FOUND:", data);

      userData = {
        id: doc.id,
        name: `${(data.firstName || "").trim()} ${(data.name || "").trim()}`,
        classId: data.classId || null,
      };

      role = "ELEVE";
    }

    // =========================
    // 🔑 UID
    // =========================
    const uid = userData.id;

    // =========================
    // 🛡️ PERMISSIONS
    // =========================
    const permissions =
      role === "ADMIN"
        ? ["ALL"]
        : role === "SURVEILLANT"
        ? ["READ", "WRITE", "SMS"]
        : ["READ"];

    // =========================
    // 🔥 CUSTOM TOKEN FIREBASE
    // =========================
    const token = await admin.auth().createCustomToken(uid, {
      role,
      classId: userData.classId || null,
      permissions,
    });

    // =========================
    // ✅ RESPONSE
    // =========================
    return res.json({
      token,
      uid,
      name: userData.name,
      role,
      classId: userData.classId || null,
      permissions,
    });

  } catch (err: any) {

    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      error: "Erreur serveur",
      details: err.message,
    });
  }
});

// =========================
// ORANGE TOKEN
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
// SMS ORANGE (RESTORED)
// =========================
apiRouter.post("/orange/sms", verifyFirebaseToken, async (req: any, res: any) => {
  const user = req.user;

  if (!user.permissions?.includes("SMS")) {
    return res.status(403).json({ error: "Not allowed" });
  }
  const { to, message } = req.body || {};

    if (!to || !message) {
      return res.status(400).json({ error: "Missing data" });
    }

  const token = await getOrangeToken();
  if (!token) return res.status(503).json({ error: "Orange API unavailable" });

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

  } catch (err) {
    return res.status(500).json({ error: "SMS failed" });
  }
});

// =========================
// FRONTEND SERVE
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

    app.get(/.*/, (req, res) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).send("API route not found");
      }

      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });

  // =========================
  // TIMEOUT RENDER FIX
  // =========================
  server.setTimeout(60000);

  // =========================
  // KEEP ALIVE
  // =========================
  const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

  setInterval(async () => {
    try {
      await fetch(`${BASE_URL}/api/health`);
      console.log("🔄 Keep-alive OK");
    } catch {
      console.log("⚠️ Keep-alive failed");
    }
  }, 5 * 60 * 1000);
}

startServer();
import { auth } from "./firebaseConfig";

/**
 * Génère un matricule unique pour le LTP Fatick
 */
export const generateMatricule = (): string => {
  const prefix = "LTPF";
  const year = new Date().getFullYear();
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return `${prefix}-${year}-${randomPart}`;
};

/**
 * Nettoie un objet pour Firestore/JSON
 */
export const toPlainObject = (obj: any, seen = new WeakSet()): any => {
  if (obj === null || typeof obj !== "object") return obj;

  if (seen.has(obj)) return "[Circular]";
  if (obj instanceof Date) return obj.toISOString();

  if ((obj.constructor && obj.constructor.name === "Y") || obj.src || obj.nodeType) {
    return null;
  }

  seen.add(obj);

  const clean: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === "function" || key.startsWith("_")) continue;
      if (value === undefined) continue;

      clean[key] = toPlainObject(value, seen);
    }
  }

  return clean;
};

// =========================
// 🔐 AUTH HEADER CENTRALISÉ
// =========================
export const getAuthHeader = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Utilisateur non authentifié");
  }

  const token = await user.getIdToken();

  return {
    Authorization: `Bearer ${token}`,
  };
};

// =========================
// 🔁 FETCH AVEC RETRY + TIMEOUT
// =========================
export const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response;
      }

      return response;

    } catch (err: any) {
      clearTimeout(timeout);
      console.warn(`[API] Tentative ${i + 1} échouée pour ${url}`, err.message);

      if (i === retries - 1) throw err;

      await new Promise(res => setTimeout(res, 2000 * (i + 1)));
    }
  }

  throw new Error("Maximum retries reached");
};

// =========================
// 🔐 FETCH AUTHENTIFIÉ (NEW)
// =========================
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
  retries = 3
) => {
  const headers = {
    ...(options.headers || {}),
    ...(await getAuthHeader()),
  };

  return fetchWithRetry(url, {
    ...options,
    headers,
  }, retries);
};

// =========================
// 🔐 LOGIN MATRICULE (NEW)
// =========================
export const loginWithMatricule = async (matricule: string) => {
  const response = await fetchWithRetry(
    `${import.meta.env.VITE_API_URL}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        matricule,
        code: matricule, // ⚠️ IMPORTANT (compat backend)
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  return data;
};
// =========================
// 📩 SMS ORANGE (AMÉLIORÉ)
// =========================
export const sendSMS = async (
  to: string,
  message: string
): Promise<boolean> => {
  try {
    const cleanTo = to.replace(/\s+/g, "").trim();

    const response = await fetchWithAuth(
      `${import.meta.env.VITE_API_URL}/api/orange/sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: cleanTo,
          message,
        }),
      }
    );

    return response.ok;

  } catch (error) {
    console.error("SMS error:", error);
    return false;
  }
};

// =========================
// 📩 SMS ABSENCE
// =========================
export const sendAbsenceSMS = async (
  parentPhone: string,
  studentName: string
): Promise<boolean> => {
  const message =
    `LTP FATICK : Votre enfant ${studentName} est absent aujourd’hui. ` +
    `Merci de contacter la surveillance.`;

  return sendSMS(parentPhone, message);
};
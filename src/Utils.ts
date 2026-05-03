import { auth } from "./firebaseConfig";
/**
 * Génère un matricule unique pour le LTP Fatick
 * Format: LTPF-2026-[ID_ALEATOIRE]
 * @returns {string} Le matricule généré
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
 * Nettoie un objet pour Firestore/JSON (retire les références circulaires et les types complexes)
 */
export const toPlainObject = (obj: any, seen = new WeakSet()): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  // Éviter les boucles infinies / structures circulaires
  if (seen.has(obj)) return "[Circular]";
  
  if (obj instanceof Date) return obj.toISOString();
  
  // On ne traite pas les éléments DOM ou les objets internes Firebase trop complexes
  if (obj.constructor && obj.constructor.name === 'Y' || obj.src || obj.nodeType) {
    return null;
  }

  seen.add(obj);

  const clean: any = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      // Ignorer les fonctions et les propriétés privées Firebase
      if (typeof value === 'function' || key.startsWith('_')) continue;
      if (value === undefined) continue;
      
      clean[key] = toPlainObject(value, seen);
    }
  }
  
  return clean;
};

/**
 * Envoie un de SMS via l'API proxy (Backend)
 */
export const sendSMS = async (
  to: string,
  message: string
): Promise<boolean> => {
  try {
    const cleanTo = to.replace(/\s+/g, "").trim();

    // 🔐 Récupération du token Firebase
    const user = auth.currentUser;

    if (!user) {
      console.error("❌ User not authenticated");
      return false;
    }

    const token = await user.getIdToken();

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/orange/sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 🔥 IMPORTANT
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

/**
 * Envoie un message d'absence spécifique
 */
export const sendAbsenceSMS = async (
  parentPhone: string,
  studentName: string
): Promise<boolean> => {
  const message =
    `LTP FATICK : Votre enfant ${studentName} est absent aujourd’hui. ` +
    `Merci de contacter la surveillance.`;

  return sendSMS(parentPhone, message);
};
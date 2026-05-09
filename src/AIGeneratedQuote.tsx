import React, { useState, useEffect, useCallback } from 'react';
import { Quote, Sparkles, RefreshCw, Loader2, Bot } from 'lucide-react';
import { auth } from './firebaseConfig';
import { GoogleGenAI } from "@google/genai";

export const AIGeneratedQuote: React.FC = () => {
  const [quote, setQuote] = useState<string | null>(null);
  const [author, setAuthor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const generateQuote = useCallback(async (force = false) => {
    // =========================
    // CACHE (24h)
    // =========================
    if (!force) {
      const cachedQuote = localStorage.getItem('school_ai_quote');
      const cachedAuthor = localStorage.getItem('school_ai_author');
      const cachedTime = localStorage.getItem('school_ai_quote_time');

      if (cachedQuote && cachedAuthor && cachedTime) {
        const lastFetch = new Date(cachedTime);
        const now = new Date();
        const diffInHours =
          (now.getTime() - lastFetch.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
          setQuote(cachedQuote);
          setAuthor(cachedAuthor);
          return;
        }
      }
    }

    // =========================
    // AUTH (Firebase timing safe)
    // =========================
    if (!auth.currentUser) {
      console.warn("Utilisateur non prêt (Firebase)");
      return;
    }

    setIsLoading(true);
    setError(false);

    try {
      // =========================
      // PROMPT
      // =========================
      const prompt = `
Donne une citation inspirante pour des élèves.
Réponds uniquement en JSON :
{
  "citation": "...",
  "auteur": "..."
}
`;

      const token = await auth.currentUser.getIdToken();

      // =========================
      // API CALL
      // =========================
 const generateQuote = useCallback(async (force = false) => {
  setIsLoading(true);
  setError(false);

  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) throw new Error("Missing API key");

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
Donne une citation inspirante pour des élèves du Sénégal.
Réponds uniquement en JSON :
{"citation":"...","auteur":"..."}
`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    // =========================
    // EXTRACTION SAFE TEXTE
    // =========================
    const text =
      response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // =========================
    // PARSING SAFE JSON
    // =========================
    let parsed = { citation: "", auteur: "" };

    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.warn("Réponse IA non JSON:", text);
    }

    setQuote(parsed.citation || "Erreur de génération");
    setAuthor(parsed.auteur || "Inconnu");

  } catch (err) {
    console.error("AI error:", err);
    setError(true);
  } finally {
    setIsLoading(false);
  }
}, []);

      const newQuote =
        parsed.citation ||
        "L'excellence est le résultat de la rigueur et de la passion.";

      const newAuthor =
        parsed.auteur || "L'Esprit de Fatick";

      setQuote(newQuote);
      setAuthor(newAuthor);

      // =========================
      // CACHE SAVE
      // =========================
      localStorage.setItem('school_ai_quote', newQuote);
      localStorage.setItem('school_ai_author', newAuthor);
      localStorage.setItem('school_ai_quote_time', new Date().toISOString());

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      const isQuotaError =
        errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED');

      if (!isQuotaError) {
        console.error("Erreur génération citation:", err);
      }

      setError(true);

      const fallbackQuote =
        "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte.";

      const fallbackAuthor =
        "Winston Churchill";

      setQuote(fallbackQuote);
      setAuthor(fallbackAuthor);

      // Cache fallback si quota atteint
      if (isQuotaError) {
        localStorage.setItem('school_ai_quote', fallbackQuote);
        localStorage.setItem('school_ai_author', fallbackAuthor);
        localStorage.setItem('school_ai_quote_time', new Date().toISOString());
      }

    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    generateQuote();
  }, [generateQuote]);

  return (
    <div className="glass rounded-[2.5rem] p-8 border border-indigo-500/20 shadow-xl relative overflow-hidden group">
      
      {/* Glow effect */}
      <div className="absolute -left-10 -top-10 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-600/20 transition-all duration-700" />

      {/* HEADER */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/10 rounded-xl text-indigo-400">
            <Bot size={20} className={isLoading ? "animate-bounce" : ""} />
          </div>

          <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] flex items-center gap-2">
            Inspiration IA
            <Sparkles size={12} className="animate-pulse" />
          </h4>
        </div>

        <button
          onClick={() => generateQuote(true)}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-white/5 rounded-xl transition-all disabled:opacity-30"
          title="Nouvelle citation"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* CONTENT */}
      <div className="relative z-10">
        {isLoading ? (
          <div className="py-6 flex flex-col items-center justify-center gap-3">
            <Loader2 size={24} className="animate-spin text-indigo-500/50" />
            <p className="text-[9px] font-black uppercase text-slate-500 animate-pulse">
              Consultation de l'Oracle...
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="relative">
              <Quote size={32} className="absolute -left-2 -top-4 opacity-5 text-indigo-400" />

              <p className="text-[15px] font-bold italic text-slate-700 dark:text-slate-200 leading-relaxed px-2">
                "{quote || "Chargement..."}"
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pr-2">
              <div className="h-px w-8 bg-indigo-500/30" />
              <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">
                — {author || "Auteur inconnu"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ERROR */}
      {error && !isLoading && (
        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-bold text-slate-500 uppercase opacity-50">
          Mode secours activé
        </p>
      )}
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { Quote, Sparkles, RefreshCw, Loader2, Bot } from 'lucide-react';

const FALLBACK_QUOTES = [
  { citation: "L'excellence technique est le levier du développement de notre nation.", auteur: "Direction LTP Fatick" },
  { citation: "Le savoir-faire est une richesse que personne ne peut vous voler.", auteur: "Adage Technique" },
  { citation: "Innover à Fatick, c'est construire le Sénégal de demain.", auteur: "Esprit Campus" },
  { citation: "La persévérance transforme les difficultés en opportunités de réussite.", auteur: "Anonyme" },
  { citation: "Le travail bien fait est la meilleure des cartes de visite.", auteur: "Proverbe du Travailleur" },
  { citation: "L'avenir appartient à ceux qui maîtrisent la science et la technologie.", auteur: "Cheikh Anta Diop" },
  { citation: "Chaque geste technique maîtrisé est un pas vers l'autonomie.", auteur: "Formateur LTP" },
  { citation: "Soyez fiers de votre formation, elle est le socle de votre indépendance.", auteur: "Lycée Technique de Fatick" }
];

export const CampusQuote: React.FC = () => {
  const [quote, setQuote] = useState<string | null>(null);
  const [author, setAuthor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        const diffInHours = (now.getTime() - lastFetch.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
          setQuote(cachedQuote);
          setAuthor(cachedAuthor);
          return;
        }
      }
    }

    setIsLoading(true);
    
    // Simuler un léger chargement pour l'effet visuel
    await new Promise(resolve => setTimeout(resolve, 800));

    // Sélection aléatoire dans la liste locale (LocalStorage inspiration)
    const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
    const selected = FALLBACK_QUOTES[randomIndex];

    setQuote(selected.citation);
    setAuthor(selected.auteur);

    localStorage.setItem('school_ai_quote', selected.citation);
    localStorage.setItem('school_ai_author', selected.auteur);
    localStorage.setItem('school_ai_quote_time', new Date().toISOString());
    
    setIsLoading(false);
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
            Inspiration Campus
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
              Sélection du jour...
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

      {/* INFO */}
      <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-bold text-slate-500 uppercase opacity-30">
        Savoir & Technologie
      </p>
    </div>
  );
};

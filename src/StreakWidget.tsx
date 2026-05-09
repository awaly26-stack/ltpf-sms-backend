
import React, { useMemo } from 'react';
import { Flame, Trophy, Info } from 'lucide-react';
import { AbsenceLog } from './types';

interface StreakWidgetProps {
  absenceLogs: AbsenceLog[];
  userName?: string;
}

export const StreakWidget: React.FC<StreakWidgetProps> = ({ absenceLogs = [], userName }) => {
  const streak = useMemo(() => {
    // On ne prend que les absences du cycle actuel (non exportées)
    const activeLogs = absenceLogs.filter(l => !l.isExported);
    
    if (activeLogs.length === 0) {
      // Si aucune absence, on simule une série de 14 jours par défaut (récompense)
      return 14;
    }

    // On trie pour avoir la plus récente
    const sortedLogs = [...activeLogs].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const lastAbsenceDate = new Date(sortedLogs[0].date);
    const today = new Date();
    
    // On remet les heures à zéro pour comparer uniquement les jours
    today.setHours(0, 0, 0, 0);
    lastAbsenceDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastAbsenceDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }, [absenceLogs]);

  const config = useMemo(() => {
    const goal = 10;
    const progress = Math.min((streak / goal) * 100, 100);
    
    if (streak === 0) {
      return {
        message: "Dommage, série brisée, relève le défi !",
        color: "text-slate-400",
        flameColor: "text-slate-300",
        bgColor: "bg-slate-500/10",
        progress
      };
    } else if (streak < 4) {
      return {
        message: "C'est un bon début, continue !",
        color: "text-orange-400",
        flameColor: "text-orange-500",
        bgColor: "bg-orange-500/10",
        progress
      };
    } else if (streak < 8) {
      return {
        message: "Tu prends du rythme, bravo !",
        color: "text-orange-500",
        flameColor: "text-orange-600",
        bgColor: "bg-orange-600/10",
        progress
      };
    } else {
      return {
        message: "Tu es en feu ! L'excellence t'attend !",
        color: "text-rose-500",
        flameColor: "text-rose-600",
        bgColor: "bg-rose-600/10",
        progress
      };
    }
  }, [streak]);

  return (
    <div className="glass rounded-[3rem] p-8 border border-white/5 shadow-2xl space-y-6 relative overflow-hidden group">
      {/* Background decoration */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20 ${config.bgColor}`} />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${config.bgColor} ${config.flameColor} transition-colors duration-500`}>
            <Flame size={24} className={streak > 0 ? "animate-pulse" : ""} />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Série de Ponctualité</h3>
            <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-tighter">Silicon Campus Discipline</p>
          </div>
        </div>
        <div className="h-10 w-10 glass rounded-xl flex items-center justify-center text-slate-400">
          <Info size={16} />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-5xl font-black ${config.color} transition-colors duration-500`}>
          {streak.toString().padStart(2, '0')}
        </span>
        <span className="text-xs font-black uppercase text-slate-500">Jours</span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 italic leading-snug max-w-[70%]">
            "{config.message}"
          </p>
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-500 uppercase">Objectif Badge</p>
            <p className="text-[10px] font-black text-indigo-500">10 Jours</p>
          </div>
        </div>
        
        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${config.progress}%` }}
          />
        </div>
      </div>

      {streak >= 10 && (
        <div className="flex items-center gap-2 pt-2 animate-bounce">
          <Trophy size={14} className="text-amber-500" />
          <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest">Badge Assiduité Débloqué !</span>
        </div>
      )}
    </div>
  );
};

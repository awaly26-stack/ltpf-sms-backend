import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Target, Award, CheckCircle2, Loader, Clock, Star, Sparkles, AlertCircle, HandMetal, CheckCircle, ChevronRight, Send } from 'lucide-react';
import { Student, ChallengeAction } from './types';
import { CURRENT_WEEKLY_CHALLENGE } from './constants';

interface WeeklyChallengeProps {
  student: Student;
  onUpdateStudent?: (updated: Student) => void;
}

export const WeeklyChallenge: React.FC<WeeklyChallengeProps> = ({ student, onUpdateStudent }) => {
  const challenge = CURRENT_WEEKLY_CHALLENGE;
  const [proof, setProof] = useState('');
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Fix: Use ReturnType instead of NodeJS.Timeout for browser environment compatibility
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const REQUIRED_ACTIONS = 3; // Nombre d'actions requises par semaine pour ce type de défi

  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const currentChallengeActions = (student.challengeActions || []).filter(action => 
      action.challengeId === challenge.id && new Date(action.date) >= startOfWeek
    );

    const completedCount = currentChallengeActions.length;
    const isTodayValidated = currentChallengeActions.some(action => 
      new Date(action.date).toDateString() === now.toDateString()
    );

    const isFinished = completedCount >= REQUIRED_ACTIONS;

    return {
      completedCount,
      isTodayValidated,
      isFinished,
      progressPercent: (completedCount / REQUIRED_ACTIONS) * 100,
      currentChallengeActions
    };
  }, [student.challengeActions, challenge.id]);

  const startPress = () => {
    if (stats.isTodayValidated || stats.isFinished || !proof.trim()) return;
    
    setIsPressing(true);
    setPressProgress(0);
    
    const startTime = Date.now();
    const duration = 2000; // 2 secondes

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setPressProgress(progress);
      
      if (progress >= 100) {
        handleComplete();
      }
    }, 20);
  };

  const endPress = () => {
    setIsPressing(false);
    setPressProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const handleComplete = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setIsPressing(false);
    
    const newAction: ChallengeAction = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      proof: proof.trim(),
      challengeId: challenge.id
    };

    const updatedStudent = {
      ...student,
      challengeActions: [newAction, ...(student.challengeActions || [])]
    };

    if (onUpdateStudent) {
      onUpdateStudent(updatedStudent);
      setShowSuccess(true);
      setProof('');
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  if (!challenge) return null;

  return (
    <div className={`glass rounded-[3rem] p-8 border ${stats.isFinished ? 'border-emerald-500/30' : 'border-indigo-500/20'} shadow-2xl relative overflow-hidden transition-all duration-500`}>
      {/* Effet visuel de succès */}
      {showSuccess && (
        <div className="absolute inset-0 z-50 bg-emerald-500/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
          <Sparkles size={48} className="text-white animate-bounce" />
          <p className="text-xl font-black text-white uppercase mt-4">Action Validée !</p>
          <p className="text-sm font-bold text-emerald-100">+10 Points de Mérite</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${stats.isFinished ? 'bg-emerald-500/20 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
            {stats.isFinished ? <HandMetal size={24} /> : <Target size={24} />}
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Défi de la Semaine</h4>
            <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Silicon Campus Engagement</p>
          </div>
        </div>
        
        {stats.isFinished ? (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 rounded-full border border-emerald-500/30">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="text-[8px] font-black uppercase text-emerald-500">Défi Complété</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 rounded-full border border-amber-500/20">
            <Clock size={14} className="text-amber-500" />
            <span className="text-[8px] font-black uppercase text-amber-500">En cours...</span>
          </div>
        )}
      </div>

      <div className="space-y-6 relative z-10">
        <div>
          <h3 className="text-xl font-black uppercase text-white leading-tight tracking-tight">{challenge.title}</h3>
          <p className="text-[11px] text-slate-400 font-medium mt-1.5 leading-relaxed italic opacity-80">"{challenge.description}"</p>
        </div>

        {/* Checklist visuelle */}
        <div className="flex gap-2">
          {[...Array(REQUIRED_ACTIONS)].map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 h-12 rounded-2xl border flex items-center justify-center transition-all duration-500 ${
                i < stats.completedCount 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' 
                : 'bg-white/5 border-white/10 text-slate-600'
              }`}
            >
              {i < stats.completedCount ? <CheckCircle2 size={20} /> : <div className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />}
            </div>
          ))}
        </div>

        {/* Zone d'action pour l'élève */}
        {!stats.isFinished && !stats.isTodayValidated && (
          <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
            <div className="relative group">
              <input 
                type="text" 
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder="Décris ton action du jour..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-[11px] font-bold text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors">
                <Send size={14} />
              </div>
            </div>

            <div className="relative">
              <button 
                onMouseDown={startPress}
                onMouseUp={endPress}
                onMouseLeave={endPress}
                onTouchStart={startPress}
                onTouchEnd={endPress}
                disabled={!proof.trim()}
                className={`w-full relative h-16 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest transition-all overflow-hidden shadow-xl active:scale-95 disabled:opacity-30 disabled:grayscale ${
                  isPressing ? 'scale-[0.98]' : ''
                } bg-indigo-600 text-white`}
              >
                {/* Overlay de progression de l'appui long */}
                <div 
                  className="absolute left-0 top-0 h-full bg-indigo-400/50 pointer-events-none transition-all duration-75"
                  style={{ width: `${pressProgress}%` }}
                />
                
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <HandMetal size={18} className={isPressing ? 'animate-pulse' : ''} />
                  {isPressing ? 'Maintiens pour valider...' : 'Valider mon action (2s)'}
                </span>
              </button>
              
              {proof.trim() && !isPressing && (
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full animate-ping" />
              )}
            </div>
          </div>
        )}

        {stats.isTodayValidated && !stats.isFinished && (
          <div className="bg-indigo-600/10 border border-indigo-500/20 p-5 rounded-[2rem] flex items-center gap-4">
             <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0">
               <CheckCircle2 size={20} />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase text-indigo-400">Action déjà validée !</p>
               <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Reviens demain pour ton prochain défi.</p>
             </div>
          </div>
        )}

        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${stats.isFinished ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-indigo-600'}`}
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
export default WeeklyChallenge;
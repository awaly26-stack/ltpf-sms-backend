
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Landmark, ShieldCheck, ArrowRight, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Login: React.FC = () => {
  const [loginCode, setLoginCode] = useState('');
  const { login, backendAwake } = useAuth();
  const [localLoading, setLocalLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLocalLoading(true);
    setIsError(false);
    const success = await login(loginCode);
    if (!success) {
      setIsError(true);
      // Animation secousse
      const el = document.getElementById('login-card');
      el?.classList.add('animate-shake');
      setTimeout(() => el?.classList.remove('animate-shake'), 500);
    }
    setLocalLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-slate-950">
      {/* Background Decor */}
      <div className="mesh-bg opacity-30"></div>
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-rose-600/20 blur-[120px] rounded-full"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        id="login-card"
        className="glass w-full max-w-md p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl relative z-10 bg-slate-900/40 backdrop-blur-3xl"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="h-20 w-20 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-3xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-indigo-500/30"
          >
            <Landmark size={40} />
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-2 font-display uppercase tracking-tight">EduTechPro</h1>
          <p className="text-slate-400 font-medium text-[10px] uppercase tracking-[0.3em]">Lycée Technique • Fatick</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Matricule d'accès</label>
            <div className="relative group">
              <input
                type="text"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value.toUpperCase())}
                placeholder="EX: LTPF-2024-XXXX"
                disabled={localLoading}
                className={`w-full bg-slate-950/50 border-2 rounded-2xl py-5 px-6 text-white text-sm font-bold tracking-widest transition-all placeholder:text-slate-700 outline-none
                  ${isError ? 'border-rose-500/50 focus:border-rose-500 shadow-lg shadow-rose-500/10' : 'border-white/5 focus:border-indigo-500 group-hover:border-white/10'}
                `}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-700">
                <ShieldCheck size={20} />
              </div>
            </div>
            <AnimatePresence>
              {isError && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-rose-500 text-[10px] font-bold uppercase tracking-wider ml-2"
                >
                  Matricule inconnu ou accès refusé
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button
            type="submit"
            disabled={localLoading || !backendAwake}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all relative overflow-hidden
              bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98] shadow-xl shadow-indigo-600/20
              disabled:opacity-50 disabled:cursor-not-allowed font-display
            `}
          >
            {localLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Accéder à la plateforme <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/5 border border-indigo-500/10 mb-4">
             <div className={`h-2 w-2 rounded-full ${backendAwake ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
               {backendAwake ? 'Serveur Opérationnel' : 'Démarrage du système...'}
             </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-500 opacity-30">
            <Info size={14} className="" />
            <p className="text-[10px] font-bold uppercase tracking-wider">Solution SaaS Professionnelle</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

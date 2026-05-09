
import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export const Login: React.FC = () => {
  const [loginCode, setLoginCode] = useState('');
  const { login, backendAwake } = useAuth();
  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = async () => {
    setLocalLoading(true);
    const success = await login(loginCode);
    if (!success) {
      alert("Matricule inconnu.");
    }
    setLocalLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-950">
      <div className="w-full max-w-md space-y-12 animate-in fade-in duration-700">
        <div className="text-center">
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter">
            EduTech<span className="text-indigo-600">Pro</span>
          </h1>
          <p className="text-lg font-bold text-slate-400 uppercase tracking-[0.4em]">LTPF</p>
          
          {!backendAwake && (
            <p className="text-[9px] font-black uppercase text-indigo-500/50 mt-4 animate-pulse">
              ⏳ Démarrage du serveur... veuillez patienter
            </p>
          )}
        </div>
        <div className="glass p-10 rounded-[3.5rem] space-y-6 shadow-2xl border border-white/5">
          <input 
            type="text" 
            value={loginCode} 
            onChange={e => setLoginCode(e.target.value)} 
            placeholder="VOTRE MATRICULE" 
            disabled={localLoading}
            className="w-full bg-slate-900 rounded-2xl py-6 px-6 text-white text-center font-black outline-none border border-transparent focus:border-indigo-500 transition-all placeholder:text-slate-700" 
          />
          <button 
            onClick={handleSubmit} 
            disabled={localLoading || !backendAwake}
            className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black uppercase shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {localLoading ? "Connexion..." : (!backendAwake ? "Serveur en veille..." : "Accéder")}
          </button>
        </div>
      </div>
    </div>
  );
};

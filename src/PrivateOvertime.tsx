
import React, { useState } from 'react';
import { PlusCircle, Wallet, Clock, Trash2, History, Building, Check } from 'lucide-react';
import { PrivateOvertimeLog, SchoolClass } from './types';

interface PrivateOvertimeProps {
  logs: PrivateOvertimeLog[];
  classes: SchoolClass[];
  onAdd: (log: PrivateOvertimeLog) => void;
  onDelete: (id: string) => void;
}

export const PrivateOvertime: React.FC<PrivateOvertimeProps> = ({ logs, classes, onAdd, onDelete }) => {
  const [hours, setHours] = useState<number>(2);
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [showForm, setShowForm] = useState(false);

  const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || hours <= 0) return;

    const newLog: PrivateOvertimeLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      hours,
      classId: selectedClassId,
    };

    onAdd(newLog);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-[10px] font-black uppercase text-violet-500 tracking-[0.3em] flex items-center gap-2">
          <Wallet size={16} /> Heures Supplémentaires Privées
        </h4>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`p-2 rounded-xl transition-all shadow-lg ${showForm ? 'bg-rose-500 text-white' : 'bg-violet-600 text-white'}`}
        >
          {showForm ? <Trash2 size={16} className="rotate-45" /> : <PlusCircle size={16} />}
        </button>
      </div>

      {/* Résumé Cumulatif */}
      <div className="glass p-6 rounded-[2.5rem] border border-violet-500/20 bg-violet-600/5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Cumul du cycle</p>
            <p className="text-2xl font-black text-white">{totalHours} <span className="text-xs text-violet-400">Heures</span></p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-violet-400 uppercase italic">LTPF Campus Private</p>
        </div>
      </div>

      {/* Formulaire de Saisie */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass p-8 rounded-[3rem] border border-violet-500/30 bg-violet-600/10 space-y-6 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Quantité (H)</label>
              <div className="flex items-center bg-slate-900/50 rounded-2xl p-2 border border-white/5">
                <button type="button" onClick={() => setHours(Math.max(1, hours - 1))} className="w-10 h-10 flex items-center justify-center text-white font-black">-</button>
                <input 
                  type="number" 
                  value={hours} 
                  onChange={e => setHours(parseInt(e.target.value) || 0)}
                  className="w-full bg-transparent text-center font-black text-white outline-none"
                />
                <button type="button" onClick={() => setHours(hours + 1)} className="w-10 h-10 flex items-center justify-center text-white font-black">+</button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Classe Cible</label>
              <select 
                value={selectedClassId} 
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full h-14 bg-slate-900/50 rounded-2xl px-4 text-[10px] font-black uppercase text-white outline-none border border-white/5 appearance-none"
              >
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-violet-600 text-white py-5 rounded-2xl font-black uppercase text-[11px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
            <Check size={18} /> Valider la séance
          </button>
        </form>
      )}

      {/* Historique */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-2 text-slate-500 mb-4">
          <History size={14} />
          <span className="text-[8px] font-black uppercase tracking-widest">Historique des séances privées</span>
        </div>
        
        {logs.length > 0 ? (
          <div className="space-y-2">
            {[...logs].reverse().map(log => {
              const cls = classes.find(c => c.id === log.classId);
              return (
                <div key={log.id} className="glass p-5 rounded-3xl border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 font-black text-xs">
                      +{log.hours}H
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white uppercase">{cls?.name || 'Inconnue'}</p>
                      <p className="text-[7px] font-bold text-slate-500 uppercase">{new Date(log.date).toLocaleDateString()} • {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onDelete(log.id)}
                    className="p-2 text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : !showForm && (
          <div className="py-10 text-center glass rounded-[2.5rem] border-dashed border-white/10 opacity-30">
            <Clock size={32} className="mx-auto mb-3" />
            <p className="text-[9px] font-black uppercase tracking-widest">Aucune séance enregistrée</p>
          </div>
        )}
      </div>
    </div>
  );
};
